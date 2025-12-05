import { Controller, Post, UploadedFile, UseInterceptors, UseGuards, Get, Param, BadRequestException, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { MediaService } from '../application/services/media.service';
import { FileInterceptor, type File } from '@nest-lab/fastify-multer';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
	constructor(private readonly mediaService: MediaService) { }

	@Post('upload-url')
	@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } })) // 50MB limit
	async upload(@UploadedFile() file: File, @Query('isPrimary') isPrimary?: boolean) {
		if (!file) {
			return { message: 'No file received' };
		}
		if (!file.buffer) {
			return { message: 'No file buffer received' };
		}
		const saved = await this.mediaService.upload({
			originalname: file.filename ?? 'unknown',
			mimetype: file.mimetype,
			buffer: file.buffer,
		}, isPrimary);
		return saved;
	}

	@Get(':id')
	async get(@Param('id') id: string) {
		const image = await this.mediaService.get(id);
		return {
			id: image.id,
			filename: image.filename,
			data: image.data,
			isPrimary: image.isPrimary,
		};
	}
}
