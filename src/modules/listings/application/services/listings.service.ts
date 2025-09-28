import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../../domain/entities/listing.entity';
import { CreateListingDto } from '../../presentation/dto/create-listing.dto';
import { User } from '../../../user/domain/entities/user.entity';
import { ListingMapper } from '../mappers/listing.mapper';
import { ListingResponseDto } from '../../presentation/dto/listing-response.dto';
import { FilterListingsDto } from '../../presentation/dto/filter-listings.dto';

@Injectable()
export class ListingsService {
    constructor(
        @InjectRepository(Listing)
        private readonly listingsRepository: Repository<Listing>,
    ) { }

    async create(dto: CreateListingDto, owner: User): Promise<ListingResponseDto> {
        const listing: Listing = this.listingsRepository.create({
            ...dto,
            owner,
        });

        const saved = await this.listingsRepository.save(listing);
        return ListingMapper.toResponse(saved);
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

}
