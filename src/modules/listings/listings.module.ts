import { Module } from '@nestjs/common';
import { ListingsController } from './presentation/listings.controller';
import { ListingsService } from './application/services/listings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './domain/entities/listing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Listing])],
  controllers: [ListingsController],
  providers: [ListingsService],

})
export class ListingsModule { }
