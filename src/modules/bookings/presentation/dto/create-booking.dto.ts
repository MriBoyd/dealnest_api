// src/modules/bookings/presentation/dto/create-booking.dto.ts
import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
    @IsUUID()
    listingId: string;

    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
