import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { BookingsService } from '../../application/services/bookings.service';
import { Booking, BookingStatus } from '../../domain/entities/booking.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Role } from '../../../../common/enums/role.enum';


describe('BookingsService (Integration)', () => {
  let service: BookingsService;
  let users: Repository<User>;
  let listings: Repository<Listing>;
  let bookings: Repository<Booking>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        TypeOrmModule.forFeature([Booking, Listing, User]),
      ],
      providers: [BookingsService],
    }).compile();

    service = moduleRef.get(BookingsService);
    users = moduleRef.get('UserRepository');
    listings = moduleRef.get('ListingRepository');
    bookings = moduleRef.get('BookingRepository');

    await bookings.query('TRUNCATE TABLE "bookings" CASCADE;');
    await listings.query('TRUNCATE TABLE "listings" CASCADE;');
    await users.query('TRUNCATE TABLE "users" CASCADE;');
  });

  it('creates a booking for an existing listing', async () => {
    const buyer = await users.save({ email: 'buyer@i.com', name: 'Buyer', role: Role.INDIVIDUAL_BUYER } as any);
    const seller = await users.save({ email: 'seller@i.com', name: 'Seller', role: Role.HOMEOWNER } as any);
    const listing = await listings.save({ title: 'Flat', price: 10, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as any);

    const created = await service.create({ listingId: listing.id, start_date: '2025-02-01', end_date: '2025-02-02' } as any, buyer);
    expect(created.id).toBeDefined();

    const found = await bookings.findOne({ where: { id: created.id }, relations: ['user', 'listing'] });
    expect(found?.user.id).toBe(buyer.id);
    expect(found?.listing.id).toBe(listing.id);
  });

  it('owner can update status; others forbidden', async () => {
    const buyer = await users.save({ email: 'buyer2@i.com', name: 'Buyer2', role: Role.INDIVIDUAL_BUYER } as any);
    const seller = await users.save({ email: 'seller2@i.com', name: 'Seller2', role: Role.HOMEOWNER } as any);
    const listing = await listings.save({ title: 'Car', price: 22, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as any);
    const booking = await bookings.save({ user: buyer, listing, start_date: new Date('2025-03-01'), end_date: new Date('2025-03-02') } as any);

    const updated = await service.updateStatus(booking.id, { status: BookingStatus.CONFIRMED } as any, buyer);
    expect(updated.status).toBe(BookingStatus.CONFIRMED);

    await expect(
      service.updateStatus(booking.id, { status: BookingStatus.CANCELLED } as any, { id: 'intruder', role: Role.INDIVIDUAL_BUYER } as any),
    ).rejects.toBeInstanceOf(Error);
  });

  it('getBookingDetail returns for owner and admin only', async () => {
    const buyer = await users.save({ email: 'buyer3@i.com', name: 'Buyer3', role: Role.INDIVIDUAL_BUYER } as any);
    const admin = await users.save({ email: 'admin@i.com', name: 'Admin', role: Role.ADMIN } as any);
    const seller = await users.save({ email: 'seller3@i.com', name: 'Seller3', role: Role.HOMEOWNER } as any);
    const listing = await listings.save({ title: 'Bike', price: 33, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as any);
    const booking = await bookings.save({ user: buyer, listing, start_date: new Date('2025-04-01'), end_date: new Date('2025-04-02') } as any);

    const ownerView = await service.getBookingDetail(booking.id, buyer);
    expect(ownerView.id).toBe(booking.id);

    const adminView = await service.getBookingDetail(booking.id, admin);
    expect(adminView.id).toBe(booking.id);

    await expect(
      service.getBookingDetail(booking.id, { id: 'nobody', role: Role.INDIVIDUAL_BUYER } as any),
    ).rejects.toBeInstanceOf(Error);
  });
});
