import { Listing } from '../../domain/entities/listing.entity';
import { ListingResponseDto } from '../../presentation/dto/listing-response.dto';

export class ListingMapper {
    static toResponse(listing: Listing): ListingResponseDto {
        return {
            id: listing.id,
            vertical: listing.vertical,
            title: listing.title,
            description: listing.description,
            price: Number(listing.price),
            currency: listing.currency,
            location: listing.location,
            available_from: listing.available_from,
            square_meters: listing.square_meters,
            amenities: listing.amenities,
            pet_policy: listing.pet_policy,
            nearby: listing.nearby,
            extra_costs: listing.extra_costs,
            media_group_id: listing.media_group_id,
            status: listing.status,
            verification_level: listing.verification_level,
            created_at: listing.created_at,
            updated_at: listing.updated_at,
            owner_id: listing.owner.id,
        };
    }
}
