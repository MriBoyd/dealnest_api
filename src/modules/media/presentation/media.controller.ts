import { Controller, Post, UseGuards, Get, Param, Body, Query, HttpCode, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { MediaService } from '../application/services/media.service';
// multer is registered globally in AppModule; controller uses JSON upload endpoint.

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
	constructor(private readonly mediaService: MediaService) { }

	@Post('upload-url')
	@HttpCode(201)
	async upload(@Body() body: { base64: string; filename: string; mimetype?: string }, @Query('isPrimary') isPrimary?: boolean) {
		if (!body?.base64 || !body?.filename) {
			throw new BadRequestException('base64 and filename are required');
		}
		const buffer = Buffer.from(body.base64, 'base64');
		const saved = await this.mediaService.upload({
			originalname: body.filename,
			mimetype: body.mimetype ?? 'application/octet-stream',
			buffer,
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
