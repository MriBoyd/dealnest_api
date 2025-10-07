import { IsUUID, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsUUID()
  mediaId?: string;
}
