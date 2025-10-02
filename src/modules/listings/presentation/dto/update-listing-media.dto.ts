// update-listing-media.dto.ts
import { IsArray, IsUUID } from 'class-validator';

export class UpdateListingMediaDto {
    @IsArray()
    @IsUUID('all', { each: true })
    mediaIds: string[];
}
