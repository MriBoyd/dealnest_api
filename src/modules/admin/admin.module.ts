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
import { AdminKycController } from './presentation/admin-kyc.controller';
import { KycModule } from '../kyc/kyc.module';
import { Kyc } from '../kyc/domain/entities/kyc.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAction, Listing, Booking, Kyc]),
    UserModule,
    ListingsModule,
    BookingsModule,
    KycModule,
  ],
  controllers: [
    AdminListingsController,
    AdminBookingsController,
    AdminKycController,
  ],
  providers: [AdminListingsService],
})
export class AdminModule {}
