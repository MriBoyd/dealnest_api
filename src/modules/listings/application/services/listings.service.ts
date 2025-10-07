import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Listing } from '../../domain/entities/listing.entity';
import { CreateListingDto } from '../../presentation/dto/create-listing.dto';
import { User } from '../../../user/domain/entities/user.entity';
import { ListingMapper } from '../mappers/listing.mapper';
import { ListingResponseDto } from '../../presentation/dto/listing-response.dto';
import { FilterListingsDto } from '../../presentation/dto/filter-listings.dto';
import { UpdateListingStatusDto } from '../../presentation/dto/update-listing-status.dto';
import { Media } from 'src/modules/media/domain/entities/media.entity';
import { UpdateListingMediaDto } from '../../presentation/dto/update-listing-media.dto';

@Injectable()
export class ListingsService {
  private postGisInstalled: boolean | null = null;

  constructor(
    @InjectRepository(Listing)
    private readonly listingsRepository: Repository<Listing>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async isPostGisInstalled(): Promise<boolean> {
    if (this.postGisInstalled === null) {
      const result = await this.dataSource.query(
        `SELECT 1 FROM pg_extension WHERE extname = 'postgis'`,
      );
      this.postGisInstalled = result.length > 0;
    }
    return this.postGisInstalled;
  }

  async create(
    dto: CreateListingDto,
    owner: User,
  ): Promise<ListingResponseDto> {
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

      if (mediaList.some((m) => m.listing)) {
        throw new BadRequestException(
          'Some media already assigned to another listing',
        );
      }

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
      throw new NotFoundException(
        `Listing with id ${saved.id} not found after creation.`,
      );
    }

    return ListingMapper.toResponse(updatedListing);
  }

  async findAll(filters: FilterListingsDto) {
    const qb = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.owner', 'owner')
      .leftJoinAndSelect('listing.media', 'media');

    if (filters.city) {
      qb.andWhere(`listing.location->>'city' ILIKE :city`, {
        city: `%${filters.city}%`,
      });
    }

    if (filters.vertical) {
      qb.andWhere('listing.vertical = :vertical', {
        vertical: filters.vertical,
      });
    }

    if (filters.minPrice) {
      qb.andWhere('listing.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice) {
      qb.andWhere('listing.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.q) {
      qb.andWhere('(listing.title ILIKE :q OR listing.description ILIKE :q)', {
        q: `%${filters.q}%`,
      });
    }

    if (
      filters.lat &&
      filters.lon &&
      filters.radiusKm &&
      (await this.isPostGisInstalled())
    ) {
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
          radiusMeters: filters.radiusKm * 1000,
        },
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const sortBy = filters.sortBy || 'created_at';
    const order = filters.order || 'DESC';

    qb.orderBy(`listing.${sortBy}`, order).skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => ListingMapper.toResponse(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sortBy,
        order,
      },
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
    adminUser: User,
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
      relations: ['owner', 'media'],
    });

    if (!listing) throw new NotFoundException('Listing not found');

    if (listing.owner.id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        'Not authorized to update media for this listing',
      );
    }

    if (listing.media && listing.media.length > 0) {
      for (const media of listing.media) {
        media.listing = null;
      }
      await this.mediaRepository.save(listing.media);
    }

    if (dto.mediaIds && dto.mediaIds.length > 0) {
      const newMedia = await this.mediaRepository.find({
        where: { id: In(dto.mediaIds) },
        relations: ['listing'],
      });

      if (newMedia.length !== dto.mediaIds.length) {
        throw new BadRequestException('Some media IDs were not found.');
      }

      const alreadyAssigned = newMedia.find(
        (m) => m.listing && m.listing.id !== listing.id,
      );
      if (alreadyAssigned) {
        throw new BadRequestException(
          `Media ID ${alreadyAssigned.id} is already assigned to another listing.`,
        );
      }

      listing.media = newMedia;
    } else {
      listing.media = [];
    }

    const savedListing = await this.listingsRepository.save(listing);
    return ListingMapper.toResponse(savedListing);
  }
}
