import { Module } from '@nestjs/common';
import { ListingsController } from './presentation/listings.controller';
import { ListingsService } from './application/services/listings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './domain/entities/listing.entity';
import { Category } from './domain/entities/category.entity';
import { RealEstateAttribute } from './domain/entities/real-estate.entity';
import { VehicleAttribute } from './domain/entities/vehicle.entity';
import { MediaModule } from '../media/media.module';
import { ListingImage } from '../media/domain/entities/media.entity';
import { Report } from './domain/entities/report.entity';
import { ReportsService } from './application/services/reports.service';
import { ReportsController } from './presentation/reports.controller';
import { User } from '../user/domain/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      ListingImage,
      Category,
      RealEstateAttribute,
      VehicleAttribute,
      Report,
      User,
    ]),
    MediaModule,
  ],
  controllers: [ListingsController, ReportsController],
  providers: [ListingsService, ReportsService],
  exports: [ListingsService],
})
export class ListingsModule {}
