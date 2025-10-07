// src/modules/kyc/presentation/dto/filter-kyc.dto.ts
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class FilterKycDto {
  @IsOptional()
  @IsString()
  search?: string; // for user name or email

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsIn(['name', 'email', 'submittedAt'])
  sortBy?: 'name' | 'email' | 'submittedAt' = 'submittedAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
