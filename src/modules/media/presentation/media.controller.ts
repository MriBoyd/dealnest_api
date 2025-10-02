import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MediaService } from '../application/services/media.service';
import { UploadMediaDto } from './dto/upload-media.dto';

@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload-url')
    async upload(@Body() dto: UploadMediaDto) {
        return this.mediaService.upload(dto);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const media = await this.mediaService.get(id);
        return {
            id: media.id,
            filename: media.filename,
            mimetype: media.mimetype,
            base64: media.data.toString('base64'),
        };
    }
}
