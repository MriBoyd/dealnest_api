import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsInt, Min, isUUID, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../domain/enums/transaction-type.enum';
import { PriceUnit } from '../../domain/enums/price-unit.enum';


export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

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

  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @IsEnum(PriceUnit)
  price_unit: PriceUnit;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  imageIds?: number[];

  // Real estate attributes
  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsNumber()
  areaSqm?: number;

  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  floorLevel?: number;

  @IsOptional()
  furnished?: boolean;

  // Vehicle attributes
  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsInt()
  mileageKm?: number;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  condition?: string;
}
