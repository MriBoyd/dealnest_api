import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './presentation/bookings.controller';
import { BookingsService } from './application/services/bookings.service';
import { Booking } from './domain/entities/booking.entity';
import { Listing } from '../listings/domain/entities/listing.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Booking, Listing])],
    exports: [BookingsService],
    controllers: [BookingsController],
    providers: [BookingsService],
})
export class BookingsModule {}
