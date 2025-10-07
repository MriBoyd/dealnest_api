import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Vertical } from '../../domain/enums/vertical.enum';

export class ExtraCostDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class LocationDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  subcity?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon?: number;
}

export class CreateListingDto {
  @IsEnum(Vertical)
  vertical: Vertical;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string = 'ETB';

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsDateString()
  available_from?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  square_meters?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsString()
  pet_policy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nearby?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraCostDto)
  extra_costs?: ExtraCostDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  mediaIds?: string[];
}
