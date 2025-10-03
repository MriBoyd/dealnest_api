// src/modules/bookings/presentation/admin-bookings.controller.ts
import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { BookingsService } from 'src/modules/bookings/application/services/bookings.service';
import { UpdateBookingStatusDto } from 'src/modules/bookings/presentation/dto/update-booking-status.dto';


@Controller('admin/bookings')
@UseGuards(JwtAuthGuard)
export class AdminBookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Get()
    async listAll() {
        return this.bookingsService.listAllBookings();
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
        return this.bookingsService.adminUpdateStatus(id, dto);
    }
}
