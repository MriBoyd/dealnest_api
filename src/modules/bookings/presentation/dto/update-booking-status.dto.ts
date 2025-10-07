import { IsEnum } from 'class-validator';
import { BookingStatus } from '../../domain/entities/booking.entity';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
