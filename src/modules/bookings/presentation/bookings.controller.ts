import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from '../application/services/bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()
  async create(@Body() dto: CreateBookingDto, @CurrentUser() user: User) {
    return this.bookingsService.create(dto, user);
  }

  @Get()
  async findUserBookings(@CurrentUser() user: User) {
    return this.bookingsService.findUserBookings(user);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.updateStatus(id, dto, user);
  }

  @Get('seller')
  getSellerBookings(@CurrentUser() user: User) {
    return this.bookingsService.findSellerBookings(user);
  }
}
