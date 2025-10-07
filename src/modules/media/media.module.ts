import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './application/services/media.service';
import { MediaController } from './presentation/media.controller';
import { Media } from './domain/entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  providers: [MediaService],
  exports: [MediaService],

  controllers: [MediaController],
})
export class MediaModule {}
