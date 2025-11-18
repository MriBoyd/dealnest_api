import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingImage } from '../../domain/entities/media.entity';
import { UploadMediaDto } from '../../presentation/dto/upload-media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(ListingImage)
    private readonly mediaRepo: Repository<ListingImage>,
  ) {}

  async upload(dto: UploadMediaDto): Promise<{ id: number }> {
    const buffer = Buffer.from(dto.base64, 'base64');

    const media = this.mediaRepo.create({
      imageUrl: dto.filename || 'upload',
      isPrimary: false,
      // raw image data not stored here in new structure; buffer ignored
    });

    const saved = await this.mediaRepo.save(media);
    return { id: saved.id };
  }

  async get(id: number): Promise<ListingImage> {
    const media = await this.mediaRepo.findOneBy({ id });
    if (!media) {
      throw new Error(`Media with id ${id} not found`);
    }
    return media;
  }
}
