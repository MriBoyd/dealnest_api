import { IsNotEmpty, IsString } from 'class-validator';

export class UploadMediaDto {
  @IsNotEmpty()
  @IsString()
  base64: string;

  @IsString()
  filename?: string;

  @IsString()
  mimetype?: string;
}
