import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsInt, Min, isUUID, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../domain/enums/transaction-type.enum';
import { PriceUnit } from '../../domain/enums/price-unit.enum';
import { ApiProperty } from '@nestjs/swagger';


export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000', description: 'The category id of the listing' })
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Apartment', description: 'The title of the listing' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Description', description: 'The description of the listing' })
  description?: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 120, description: 'The price of the listing' })
  price: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'ETB', description: 'The currency of the listing' })
  currency?: string = 'ETB';

  @IsEnum(TransactionType)
  @ApiProperty({ example: TransactionType.SELL, description: 'The transaction type of the listing' })
  transaction_type: TransactionType;

  @IsEnum(PriceUnit)
  @ApiProperty({ example: PriceUnit.TOTAL, description: 'The price unit of the listing' })
  price_unit: PriceUnit;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Addis', description: 'The city of the listing' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Addr', description: 'The address of the listing' })
  address: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  imageIds?: number[];

  // Real estate attributes
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
