import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { MediaService } from '../application/services/media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  async upload(@Body() dto: UploadMediaDto) {
    try {
      const result = await this.mediaService.upload(dto);
      return result;
    } catch (err) {
      console.error('MediaController.upload error:', err);
      throw err;
    }
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const image = await this.mediaService.get(Number(id));
    return {
      id: image.id,
      url: image.imageUrl,
      isPrimary: image.isPrimary,
    };
  }
}
