import { Listing } from '../../domain/entities/listing.entity';
import { ListingResponseDto, ListingImageResponseDto } from '../../presentation/dto/listing-response.dto';
import { UserMapper } from '../../../user/application/mappers/user.mapper';

export class ListingMapper {
  static toResponse(listing: Listing): ListingResponseDto {
    return {
      id: listing.id,
      owner: UserMapper.toResponse(listing.owner),
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      currency: listing.currency,
      transaction_type: listing.transaction_type,
      price_unit: listing.price_unit,
      city: listing.city,
      address: listing.address,
      status: listing.status,
      category: listing.category ? { id: (listing.category as any).id, name: (listing.category as any).name } : undefined,
      images: (listing.images?.map(
        (img): ListingImageResponseDto => ({
          id: img.id,
          url: img.imageUrl,
          isPrimary: img.isPrimary,
        }),
      ) ?? []),
      realEstateAttributes: listing.realEstateAttributes || undefined,
      vehicleAttributes: listing.vehicleAttributes || undefined,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
    };
  }
}
