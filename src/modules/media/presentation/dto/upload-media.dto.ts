import { IsNotEmpty, IsString } from 'class-validator';

export class UploadMediaDto {
  // You can keep filename and mimetype if you want, but not required for file upload
  filename?: string;
  mimetype?: string;
}
