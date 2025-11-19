import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from '../../../bookings/application/services/bookings.service';
import { Booking, BookingStatus } from '../../../bookings/domain/entities/booking.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { User } from 'src/modules/user/domain/entities/user.entity';

function createRepoMock<T>() {
  return {
    create: jest.fn((x) => x),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  } as unknown as jest.Mocked<Repository<any>>;
}

describe('BookingsService (Unit)', () => {
  let service: BookingsService;
  let bookingRepo: jest.Mocked<Repository<Booking>>;
  let listingRepo: jest.Mocked<Repository<Listing>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: createRepoMock<Booking>() },
        { provide: getRepositoryToken(Listing), useValue: createRepoMock<Listing>() },
      ],
    }).compile();

    service = moduleRef.get(BookingsService);
    bookingRepo = moduleRef.get(getRepositoryToken(Booking));
    listingRepo = moduleRef.get(getRepositoryToken(Listing));
  });

  it('create throws if listing not found', async () => {
    listingRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create({ listingId: 'x', start_date: '2025-01-01', end_date: '2025-01-02' } as CreateBookingDto, { id: 'u1' } as User),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create saves booking when listing exists', async () => {
    listingRepo.findOne.mockResolvedValue({ id: 'l1' } as Listing);
    bookingRepo.save.mockResolvedValue({ id: 'b1' } as Booking);

    const res = await service.create({ listingId: 'l1', start_date: '2025-01-01', end_date: '2025-01-02' } as CreateBookingDto, { id: 'u1' } as User);
    expect(res.id).toBe('b1');
    expect(bookingRepo.create).toHaveBeenCalled();
    expect(bookingRepo.save).toHaveBeenCalled();
  });

  it('updateStatus throws NotFound when booking missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateStatus('b-missing', { status: BookingStatus.CONFIRMED }, { id: 'u1', role: 'individual_buyer' } as User),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateStatus forbids non-owner non-admin', async () => {
    bookingRepo.findOne.mockResolvedValue({ id: 'b1', user: { id: 'u-owner' } } as Booking);
    await expect(
      service.updateStatus('b1', { status: BookingStatus.CONFIRMED }, { id: 'u2', role: 'individual_buyer' } as User),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updateStatus allows owner', async () => {
    const booking = { id: 'b1', user: { id: 'u1' }, status: BookingStatus.PENDING } as Booking;
    bookingRepo.findOne.mockResolvedValue(booking);
    bookingRepo.save.mockImplementation(async (b: any) => b);

    const res = await service.updateStatus('b1', { status: BookingStatus.CONFIRMED }, { id: 'u1', role: 'individual_buyer' } as User);
    expect(res.status).toBe(BookingStatus.CONFIRMED);
  });

  it('getBookingDetail forbids non-owner non-admin', async () => {
    bookingRepo.findOne.mockResolvedValue({ id: 'b1', user: { id: 'owner' } } as Booking);
    await expect(
      service.getBookingDetail('b1', { id: 'intruder', role: 'individual_buyer' } as User),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('cancelBooking returns success string', async () => {
    bookingRepo.findOne.mockResolvedValue({ id: 'b1', user: { id: 'u1' }, status: BookingStatus.PENDING } as Booking);
    const res = await service.cancelBooking('b1', { id: 'u1', role: 'individual_buyer' } as User);
    expect(res).toBe('Booking cancelled successfully');
  });
});
