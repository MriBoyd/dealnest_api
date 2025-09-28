import { IsOptional, IsString, IsEnum, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { Vertical } from '../../domain/enums/vertical.enum';

export class FilterListingsDto {
    @IsOptional()
    @IsString()
    city?: string; // location.city

    @IsOptional()
    @IsEnum(Vertical)
    vertical?: Vertical;

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

    // geo search
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    lat?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    lon?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    radiusKm?: number; // radius in kilometers
}
