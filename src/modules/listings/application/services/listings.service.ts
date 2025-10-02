import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Listing } from '../../domain/entities/listing.entity';
import { CreateListingDto } from '../../presentation/dto/create-listing.dto';
import { User } from '../../../user/domain/entities/user.entity';
import { ListingMapper } from '../mappers/listing.mapper';
import { ListingResponseDto } from '../../presentation/dto/listing-response.dto';
import { FilterListingsDto } from '../../presentation/dto/filter-listings.dto';
import { UpdateListingStatusDto } from '../../presentation/dto/update-listing-status.dto';
import { MediaService } from 'src/modules/media/application/services/media.service';
import { Media } from 'src/modules/media/domain/entities/media.entity';
import { UpdateListingMediaDto } from '../../presentation/dto/update-listing-media.dto';

@Injectable()
export class ListingsService {
    constructor(
        @InjectRepository(Listing)
        private readonly listingsRepository: Repository<Listing>,
        private readonly mediaService: MediaService,
        @InjectRepository(Media)
        private readonly mediaRepository: Repository<Media>,
    ) { }

    async create(dto: CreateListingDto, owner: User): Promise<ListingResponseDto> {
        const listing = this.listingsRepository.create({
            ...dto,
            owner,
        });

        const saved = await this.listingsRepository.save(listing);

        if (dto.mediaIds) {
            const mediaList = await this.mediaRepository.find({
                where: { id: In(dto.mediaIds) },
                relations: ['listing'],
            });

            if (!mediaList.length) {
                throw new BadRequestException('No media found for given group id');
            }

            // ❌ Prevent reusing media that already belongs to another listing
            if (mediaList.some((m) => m.listing)) {
                throw new BadRequestException('Some media already assigned to another listing');
            }

            // ✅ Link only if free
            for (const media of mediaList) {
                media.listing = saved;
            }

            await this.mediaRepository.save(mediaList);
        }

        const updatedListing = await this.listingsRepository.findOne({
            where: { id: saved.id },
            relations: ['media', 'owner'],
        });

        if (!updatedListing) {
            throw new NotFoundException(`Listing with id ${saved.id} not found after creation.`);
        }

        return ListingMapper.toResponse(updatedListing);
    }

    async findAll(filters: FilterListingsDto) {
        const qb = this.listingsRepository.createQueryBuilder('listing');

        // Filter by city (stored in JSONB location)
        if (filters.city) {
            qb.andWhere(`listing.location->>'city' ILIKE :city`, {
                city: `%${filters.city}%`,
            });
        }

        // Filter by vertical
        if (filters.vertical) {
            qb.andWhere('listing.vertical = :vertical', { vertical: filters.vertical });
        }

        // Filter by price range
        if (filters.minPrice) {
            qb.andWhere('listing.price >= :minPrice', { minPrice: filters.minPrice });
        }
        if (filters.maxPrice) {
            qb.andWhere('listing.price <= :maxPrice', { maxPrice: filters.maxPrice });
        }

        // Keyword search
        if (filters.q) {
            qb.andWhere(
                '(listing.title ILIKE :q OR listing.description ILIKE :q)',
                { q: `%${filters.q}%` },
            );
        }

        // Geo search (requires PostGIS installed + lat/lon in JSONB)
        if (filters.lat && filters.lon && filters.radiusKm) {
            qb.andWhere(
                `ST_DWithin(
        ST_SetSRID(ST_MakePoint(
          CAST(listing.location->>'lon' AS DOUBLE PRECISION),
          CAST(listing.location->>'lat' AS DOUBLE PRECISION)
        ), 4326)::geography,
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
        :radiusMeters
      )`,
                {
                    lat: filters.lat,
                    lon: filters.lon,
                    radiusMeters: filters.radiusKm * 1000, // convert km → meters
                },
            );
        }

        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        // Sorting
        const sortBy = filters.sortBy || 'created_at';
        const order = filters.order || 'DESC';

        qb.orderBy(`listing.${sortBy}`, order).skip(skip).take(limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            data: items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            sortBy,
            order,
        };
    }

    async findById(id: string): Promise<ListingResponseDto> {
        const listing = await this.listingsRepository.findOne({
            where: { id },
            relations: ['media', 'owner'],
        });

        if (!listing) {
            throw new NotFoundException(`Listing with id ${id} not found`);
        }

        return ListingMapper.toResponse(listing);
    }

    async updateStatus(
        id: string,
        dto: UpdateListingStatusDto,
        adminUser: User, // pass the authenticated user
    ): Promise<ListingResponseDto> {
        if (adminUser.role !== 'admin') {
            throw new ForbiddenException('Only admins can update listing status');
        }

        const listing = await this.listingsRepository.findOne({ where: { id } });

        if (!listing) {
            throw new NotFoundException(`Listing with id ${id} not found`);
        }

        listing.status = dto.status;
        listing.updated_at = new Date();

        const saved = await this.listingsRepository.save(listing);
        return ListingMapper.toResponse(saved);
    }

    async updateMedia(
        listingId: string,
        dto: UpdateListingMediaDto,
        user: User,
    ): Promise<ListingResponseDto> {
        const listing = await this.listingsRepository.findOne({
            where: { id: listingId },
            relations: ['owner', 'media'], // Ensure media is loaded
        });

        if (!listing) throw new NotFoundException('Listing not found');

        
        if (dto.mediaIds) {
            const mediaList = await this.mediaRepository.find({
                where: { id: In(dto.mediaIds) },
                relations: ['listing'],
            });

            if (mediaList.some((m) => m.listing && m.listing.id !== listing.id)) {
                throw new BadRequestException('Some media already assigned to another listing');
            }

            for (const media of mediaList) {
                media.listing = listing;
            }

            await this.mediaRepository.save(mediaList);
        }

        // Only owner or admin can modify media
        if (listing.owner.id !== user.id && user.role !== 'admin') {
            throw new ForbiddenException('Not authorized to update media');
        }

        // Disassociate existing media from this listing if not in the new mediaIds
        if (listing.media) {
            for (const existingMedia of listing.media) {
                if (!dto.mediaIds?.includes(existingMedia.id)) {
                    existingMedia.listing = null;
                    await this.mediaRepository.save(existingMedia);
                }
            }
        }

        // Associate new media with the listing
        const media: Media[] = [];
        if (dto.mediaIds && dto.mediaIds.length > 0) {
            const newMedia = await this.mediaRepository.findBy({ id: In(dto.mediaIds) });
            media.push(...newMedia);
        }
        listing.media = media;

        const saved = await this.listingsRepository.save(listing);
        return ListingMapper.toResponse(saved);
    }





}
