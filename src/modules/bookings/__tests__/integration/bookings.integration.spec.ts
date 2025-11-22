import { EmailVerification } from '../../../email/domain/entities/email-verification.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { BookingsService } from '../../application/services/bookings.service';
import { Booking, BookingStatus } from '../../domain/entities/booking.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Role } from '../../../../common/enums/role.enum';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { UpdateBookingStatusDto } from '../../presentation/dto/update-booking-status.dto';
import { TestUtils } from 'src/test/test-utils';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { UserService } from 'src/modules/user/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { Mailer } from 'src/modules/email/application/services/mailer';
import { PasswordResetToken } from 'src/modules/auth/domain/entities/password-reset-token.entity';
import { EmailService } from 'src/modules/email/application/services/email.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from 'src/modules/reviews/domain/entities/review.entity';


describe('BookingsService (Integration)', () => {
  let service: BookingsService;
  let users: Repository<User>;
  let listings: Repository<Listing>;
  let bookings: Repository<Booking>;
  let moduleRef: TestingModule; // Declare moduleRef
  let testUtils: TestUtils; // Declare testUtils

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
        TypeOrmModule.forFeature([Booking, Listing, User, Review, PasswordResetToken, EmailVerification]),

      ],
      providers: [
        BookingsService,
        TestUtils,
        AuthService,
        UserService,
        JwtService,
        Mailer,
        EmailService,
        ConfigService,
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {}, // simple mock
        }, {
          provide: getRepositoryToken(EmailVerification),
          useValue: {}, // simple mock
        },
      ],
    }).compile();

    service = moduleRef.get(BookingsService);
    users = moduleRef.get('UserRepository');
    listings = moduleRef.get('ListingRepository');
    bookings = moduleRef.get('BookingRepository');
    testUtils = moduleRef.get<TestUtils>(TestUtils); // Get TestUtils instance

    await testUtils.reloadFixtures(); // Use TestUtils to clear database
  });

  afterAll(async () => {
    await moduleRef.close(); // Close NestJS module
  });

  beforeEach(async () => {
    await testUtils.reloadFixtures(); // Ensure clean state before each test
  });

  it('creates a booking for an existing listing', async () => {
    const buyer = await users.save({ email: 'buyer@i.com', name: 'Buyer', role: Role.INDIVIDUAL_BUYER } as User);
    const seller = await users.save({ email: 'seller@i.com', name: 'Seller', role: Role.HOMEOWNER } as User);
    const listing = await listings.save({ title: 'Flat', description: 'Good', price: 10, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as Listing);

    const created = await service.create({ listingId: listing.id, start_date: '2025-02-01', end_date: '2025-02-02' } as CreateBookingDto, buyer);
    expect(created.id).toBeDefined();

    const found = await bookings.findOne({ where: { id: created.id }, relations: ['user', 'listing'] });
    expect(found?.user.id).toBe(buyer.id);
    expect(found?.listing.id).toBe(listing.id);
  });

  it('owner can update status; others forbidden', async () => {
    const buyer = await users.save({ email: 'buyer2@i.com', name: 'Buyer2', role: Role.INDIVIDUAL_BUYER } as User);
    const seller = await users.save({ email: 'seller2@i.com', name: 'Seller2', role: Role.HOMEOWNER } as User);
    const listing = await listings.save({ title: 'Car', description: 'Good', price: 22, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as Listing);
    const booking = await bookings.save({ user: buyer, listing, start_date: new Date('2025-03-01'), end_date: new Date('2025-03-02') } as Booking);

    const updated = await service.updateStatus(booking.id, { status: BookingStatus.CONFIRMED } as UpdateBookingStatusDto, buyer);
    expect(updated.status).toBe(BookingStatus.CONFIRMED);

    await expect(
      service.updateStatus(booking.id, { status: BookingStatus.CANCELLED } as UpdateBookingStatusDto, { id: 'intruder', role: Role.INDIVIDUAL_BUYER } as User),
    ).rejects.toBeInstanceOf(Error);
  });

  it('getBookingDetail returns for owner and admin only', async () => {
    const buyer = await users.save({ email: 'buyer3@i.com', name: 'Buyer3', role: Role.INDIVIDUAL_BUYER } as User);
    const admin = await users.save({ email: 'admin@i.com', name: 'Admin', role: Role.ADMIN } as User);
    const seller = await users.save({ email: 'seller3@i.com', name: 'Seller3', role: Role.HOMEOWNER } as User);
    const listing = await listings.save({ title: 'Bike', description: 'Good', price: 33, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as Listing);
    const booking = await bookings.save({ user: buyer, listing, start_date: new Date('2025-04-01'), end_date: new Date('2025-04-02') } as Booking);

    const ownerView = await service.getBookingDetail(booking.id, buyer);
    expect(ownerView.id).toBe(booking.id);

    const adminView = await service.getBookingDetail(booking.id, admin);
    expect(adminView.id).toBe(booking.id);

    await expect(
      service.getBookingDetail(booking.id, { id: 'nobody', role: Role.INDIVIDUAL_BUYER } as User),
    ).rejects.toBeInstanceOf(Error);
  });
});
