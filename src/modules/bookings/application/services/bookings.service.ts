import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { UpdateBookingStatusDto } from '../../presentation/dto/update-booking-status.dto';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
        @InjectRepository(Listing) private listingRepo: Repository<Listing>,
    ) { }

    async create(dto: CreateBookingDto, user: User) {
        const listing = await this.listingRepo.findOne({ where: { id: dto.listingId } });
        if (!listing) throw new NotFoundException('Listing not found');

        const booking = this.bookingRepo.create({
            user,
            listing,
            start_date: dto.start_date,
            end_date: dto.end_date,
            notes: dto.notes,
        });

        return this.bookingRepo.save(booking);
    }

    async listUserBookings(user: User) {
        return this.bookingRepo.find({
            where: { user: { id: user.id } },
            relations: ['listing'],
            order: { created_at: 'DESC' },
        });
    }

    async updateStatus(id: string, dto: UpdateBookingStatusDto, user: User) {
        const booking = await this.bookingRepo.findOne({ where: { id }, relations: ['user'] });
        if (!booking) throw new NotFoundException('Booking not found');

        // Allow only booking owner or admin to update
        if (booking.user.id !== user.id && user.role !== 'admin') {
            throw new ForbiddenException('Not allowed');
        }

        booking.status = dto.status;
        return this.bookingRepo.save(booking);
    }

    async listAllBookings() {
        return this.bookingRepo.find({
            relations: ['user', 'listing'],
            order: { created_at: 'DESC' },
        });
    }

    async adminUpdateStatus(id: string, dto: UpdateBookingStatusDto) {
        const booking = await this.bookingRepo.findOne({ where: { id }, relations: ['user', 'listing'] });
        if (!booking) throw new NotFoundException('Booking not found');

        booking.status = dto.status;
        return this.bookingRepo.save(booking);
    }
}
