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
    const result = await this.bookingsService.create(dto, user);
    return result;
  }

  @Get()
  async findUserBookings(@CurrentUser() user: User) {
    const result = await this.bookingsService.findUserBookings(user);
    return result;
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.bookingsService.updateStatus(id, dto, user);
    return result;
  }

  @Get('seller')
  getSellerBookings(@CurrentUser() user: User) {
    const result = this.bookingsService.findSellerBookings(user);
    return result;
  }

  @Patch(':id/cancel')
  async cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.bookingsService.cancelBooking(id, user);
    return result;
  }

  @Get(':id')
  async getBookingDetail(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.bookingsService.getBookingDetail(id, user);
    return result;
  }
}
