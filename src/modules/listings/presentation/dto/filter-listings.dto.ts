import { IsOptional, IsString, IsEnum, IsNumber, Min, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../domain/enums/transaction-type.enum';
import { PriceUnit } from '../../domain/enums/price-unit.enum';

export class FilterListingsDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  transaction_type?: TransactionType;

  @IsOptional()
  @IsEnum(PriceUnit)
  price_unit?: PriceUnit;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  // text search
  @IsOptional()
  @IsString()
  q?: string;

  // pagination
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit = 10;

  // sorting
  @IsOptional()
  @IsIn(['price', 'created_at'])
  sortBy: 'price' | 'created_at' = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  // removed geo search for simplified schema
}
