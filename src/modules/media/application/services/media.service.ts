import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingImage } from '../../domain/entities/media.entity';

@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(ListingImage)
        private readonly mediaRepo: Repository<ListingImage>,
    ) { }

    async upload(file: { originalname: string; mimetype: string; buffer: Buffer }, isPrimary?: boolean): Promise<{ id: string, filename: string, mimetype: string, isPrimary: boolean }> {
        const media = this.mediaRepo.create({
            filename: file.originalname,
			mimetype: file.mimetype,
            data: file.buffer,
            isPrimary: isPrimary || false,
        });
        console.log(isPrimary);
        const saved = await this.mediaRepo.save(media);
        return { id: saved.id, filename: saved.filename, mimetype: saved.mimetype, isPrimary: saved.isPrimary };
    }

    async get(id: string): Promise<ListingImage> {
        const media = await this.mediaRepo.findOneBy({ id });
        if (!media) {
            throw new Error(`Media with id ${id} not found`);
        }
        return media;
    }
}
