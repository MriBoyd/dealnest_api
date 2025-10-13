import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { ListingVerificationLevel } from '../../domain/entities/listing.entity';
import { Vertical } from '../../domain/enums/vertical.enum';
import { ListingStatus } from '../../domain/enums/listing-status.enum';
import { MediaResponseDto } from 'src/modules/media/presentation/dto/media-response.dto';

export class ListingResponseDto {
  id: string;
  owner: UserResponseDto;
  vertical: Vertical;
  title: string;
  description?: string;
  price: number;
  currency: string;
  location?: {
    city?: string;
    subcity?: string;
    lat?: number;
    lon?: number;
  };
  available_from?: Date;
  square_meters?: number;
  amenities?: string[];
  pet_policy?: string;
  nearby?: string[];
  extra_costs?: { name: string; amount: number }[];
  media: MediaResponseDto[];
  status: ListingStatus;
  verification_level: ListingVerificationLevel;
  created_at: Date;
  updated_at: Date;
}
