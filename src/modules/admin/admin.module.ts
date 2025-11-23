import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminListingsController } from './presentation/admin-listings.controller';
import { AdminListingsService } from './application/services/admin-listings.service';
import { UserModule } from '../user/user.module';
import { ListingsModule } from '../listings/listings.module';
import { AdminAction } from './domain/entities/admin-action.entity';
import { Listing } from '../listings/domain/entities/listing.entity';
import { AdminBookingsController } from './presentation/admin-bookings.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { Booking } from '../bookings/domain/entities/booking.entity';
import { AdSlot } from '../ads/domain/entities/ad_slot.entity';
import { AdminAdsController } from './presentation/admin-ads.controller';
import { AdminKycController } from './presentation/admin-kyc.controller';
import { AdminKycService } from './application/services/admin-kyc.service';
import { KycModule } from '../kyc/kyc.module';
import { Kyc } from '../kyc/domain/entities/kyc.entity';
import { AdsModule } from '../ads/ads.module';
import { AdminReviewsController } from './presentation/admin-reviews.controller';
import { Review } from '../reviews/domain/entities/review.entity';
import { ReviewsModule } from '../reviews/reviews.module';
import { User } from '../user/domain/entities/user.entity';
import { AdminReportsController } from './presentation/admin-reports.controller';
import { AdminReportsService } from './application/services/admin-reports.service';
import { Report } from '../listings/domain/entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminAction,
      Listing,
      Booking,
      Kyc,
      AdSlot,
      Review,
      User,
      Report,
    ]),
    UserModule,
    ListingsModule,
    BookingsModule,
    KycModule,
    AdsModule,
    ReviewsModule,
  ],
  controllers: [
    AdminListingsController,
    AdminBookingsController,
    AdminKycController,
    AdminAdsController,
    AdminReviewsController,
    AdminReportsController,
  ],
  providers: [AdminListingsService, AdminKycService, AdminReportsService],
})
export class AdminModule {}
