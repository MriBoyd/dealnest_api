import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../../domain/entities/media.entity';
import { UploadMediaDto } from '../../presentation/dto/upload-media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
  ) {}

  async upload(dto: UploadMediaDto): Promise<{ id: string }> {
    const buffer = Buffer.from(dto.base64, 'base64');

    const media = this.mediaRepo.create({
      data: buffer,
      filename: dto.filename,
      mimetype: dto.mimetype,
    });

    const saved = await this.mediaRepo.save(media);
    return { id: saved.id };
  }

  async get(id: string): Promise<Media> {
    const media = await this.mediaRepo.findOneBy({ id });
    if (!media) {
      throw new Error(`Media with id ${id} not found`);
    }
    return media;
  }
}
