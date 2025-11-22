// update-listing-media.dto.ts
import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateListingMediaDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  imageIds: number[];
}
