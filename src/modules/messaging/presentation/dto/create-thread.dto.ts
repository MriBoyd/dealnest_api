import {
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
  IsArray,
} from 'class-validator';

export class CreateThreadDto {
  @IsString()
  type: 'direct' | 'listing' | 'booking' | 'group';

  @IsOptional()
  @IsUUID()
  listing_id?: string;

  @IsOptional()
  @IsUUID()
  booking_id?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  participantIds: string[];
}
