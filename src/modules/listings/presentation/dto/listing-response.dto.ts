import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { ListingStatus } from '../../domain/enums/listing-status.enum';

export class ListingImageResponseDto {
  id: string;
  isPrimary: boolean;
}

export class ListingResponseDto {
  id: string;
  owner: UserResponseDto;
  title: string;
  description?: string;
  price: number;
  currency: string;
  transaction_type: string;
  price_unit: string;
  city: string;
  address: string;
  status: ListingStatus;
  category?: { id: string; name: string };
  images: ListingImageResponseDto[];
  realEstateAttributes?: Record<string, any>;
  vehicleAttributes?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}
