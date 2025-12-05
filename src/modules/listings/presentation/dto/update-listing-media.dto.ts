// update-listing-media.dto.ts
import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateListingMediaDto {
  @IsArray()
  @ApiProperty({ example: ['46a9ba8f-012d-4b3a-b10b-e7b6b348d81b'], description: 'Array of image IDs' })
  imageIds: string[];
}
