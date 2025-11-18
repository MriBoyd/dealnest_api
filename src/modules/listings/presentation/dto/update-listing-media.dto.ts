// update-listing-media.dto.ts
import { IsArray, IsInt } from 'class-validator';

export class UpdateListingMediaDto {
  @IsArray()
  @IsInt({ each: true })
  imageIds: number[];
}
