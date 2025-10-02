import { Module } from '@nestjs/common';
import { ListingsController } from './presentation/listings.controller';
import { ListingsService } from './application/services/listings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './domain/entities/listing.entity';
import { MediaModule } from '../media/media.module';
import { Media } from '../media/domain/entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, Media]), MediaModule],
  controllers: [ListingsController],
  providers: [ListingsService],

})
export class ListingsModule { }
