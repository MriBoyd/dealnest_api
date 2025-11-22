import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../domain/enums/transaction-type.enum';
import { PriceUnit } from '../../domain/enums/price-unit.enum';

export class CreateListingDto {

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
}
