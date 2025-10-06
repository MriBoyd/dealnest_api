// src/modules/user/presentation/dto/upload-profile-pic.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadProfilePicDto {
    @IsString()
    @IsNotEmpty()
    base64: string; // base64 encoded image string

    @IsString()
    @IsNotEmpty()
    mimetype: string; // e.g. "image/png" or "image/jpeg"
}
