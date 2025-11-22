import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/user/domain/entities/user.entity';
import { Role } from '../src/common/enums/role.enum';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { Listing } from '../src/modules/listings/domain/entities/listing.entity';
import { Booking, BookingStatus } from '../src/modules/bookings/domain/entities/booking.entity';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

dotenv.config({ path: '.env.test' });

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;

  let buyer: User;
  let seller: User;
  let admin: User;
  let buyerToken: string;
  let sellerToken: string;
  let adminToken: string;
  let listing: Listing;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    dataSource = app.get(DataSource);
    authService = app.get(AuthService);

    // reset tables
    await dataSource.getRepository(Booking).query('TRUNCATE TABLE "bookings" CASCADE;');
    await dataSource.getRepository(Listing).query('TRUNCATE TABLE "listings" CASCADE;');
    await dataSource.getRepository(User).query('TRUNCATE TABLE "users" CASCADE;');

    const userRepo = dataSource.getRepository(User);
    buyer = await userRepo.save({ email: 'buyer@e2e.com', name: 'Buyer', role: Role.INDIVIDUAL_BUYER } as User);
    seller = await userRepo.save({ email: 'seller@e2e.com', name: 'Seller', role: Role.HOMEOWNER } as User);
    admin = await userRepo.save({ email: 'admin@e2e.com', name: 'Admin', role: Role.ADMIN } as User);

    

    buyerToken = (await authService.login({ id: buyer.id, email: buyer.email, name: buyer.name, role: buyer.role, is_email_verified: true } as UserResponseDto)).access_token;
    sellerToken = (await authService.login({ id: seller.id, email: seller.email, name: seller.name, role: seller.role, is_email_verified: true } as UserResponseDto)).access_token;
    adminToken = (await authService.login({ id: admin.id, email: admin.email, name: admin.name, role: admin.role, is_email_verified: true } as UserResponseDto)).access_token;


    listing = await dataSource.getRepository(Listing).save({
      title: 'E2E Listing',
      description: 'Test description',
      price: 120,
      currency: 'ETB',
      city: 'Addis',
      address: 'Addr',
      owner: seller,
      transaction_type: 'sell',
      price_unit: 'total',
    } as Listing);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /bookings creates booking', async () => {
    const res = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ listingId: listing.id, start_date: '2025-05-01', end_date: '2025-05-02' })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });

  it('GET /bookings returns user bookings', async () => {
    const res = await request(app.getHttpServer())
      .get('/bookings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /bookings/:id/status allows owner and forbids others', async () => {
    const booking = await dataSource.getRepository(Booking).findOne({ where: {}, order: { created_at: 'DESC' } });

    await request(app.getHttpServer())
      .patch(`/bookings/${booking!.id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: BookingStatus.CONFIRMED })
      .expect(403);

    const ok = await request(app.getHttpServer())
      .patch(`/bookings/${booking!.id}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: BookingStatus.CONFIRMED })
      .expect(200);

    expect(ok.body.status).toBe(BookingStatus.CONFIRMED);
  });

  it('GET /bookings/:id returns details for owner', async () => {
    const booking = await dataSource.getRepository(Booking).findOne({ where: {}, order: { created_at: 'DESC' } });

    const res = await request(app.getHttpServer())
      .get(`/bookings/${booking!.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(res.body.id).toBe(booking!.id);
  });

  it('PATCH /bookings/:id/cancel cancels for owner', async () => {
    const booking = await dataSource.getRepository(Booking).findOne({ where: {}, order: { created_at: 'DESC' } });

    const res = await request(app.getHttpServer())
      .patch(`/bookings/${booking!.id}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(res.status).toBe(200);
  });
});
