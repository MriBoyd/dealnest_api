import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/user/domain/entities/user.entity';
import { Role } from '../src/common/enums/role.enum';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { Listing } from '../src/modules/listings/domain/entities/listing.entity';
import { ListingImage } from '../src/modules/media/domain/entities/media.entity';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';

// Load test env so AppModule connects to test DB
dotenv.config({ path: '.env.test' });

describe('Listings (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;

  let seller: User;
  let admin: User;
  let sellerToken: string;
  let adminToken: string;
  let category: any;

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
  });
  // removed duplicate 'let category;'
  let listing;
  let image1;
  let image2;
  beforeEach(async () => {
    // Clean tables
    await dataSource.getRepository(ListingImage).query('TRUNCATE TABLE "listing_images" RESTART IDENTITY CASCADE;');
    await dataSource.getRepository(Listing).query('TRUNCATE TABLE "listings" CASCADE;');
    await dataSource.getRepository(User).query('TRUNCATE TABLE "users" CASCADE;');
    await dataSource.getRepository(require('../src/modules/listings/domain/entities/category.entity').Category).query('TRUNCATE TABLE "categories" RESTART IDENTITY CASCADE;');

    const userRepo = dataSource.getRepository(User);
    seller = await userRepo.save({ email: 'seller@e2e.com', name: 'Seller', role: Role.HOMEOWNER } as User);
    admin = await userRepo.save({ email: 'admin@e2e.com', name: 'Admin', role: Role.ADMIN } as User);

    sellerToken = (await authService.login({ id: seller.id, email: seller.email, name: seller.name, role: seller.role, is_email_verified: true } as UserResponseDto)).access_token;
    adminToken = (await authService.login({ id: admin.id, email: admin.email, name: admin.name, role: admin.role, is_email_verified: true } as UserResponseDto)).access_token;

    const categoryRepo = dataSource.getRepository(require('../src/modules/listings/domain/entities/category.entity').Category);
    category = await categoryRepo.save({ name: 'Real Estate', slug: 'real-estate' });

    // Create two media
    const upload = async () => request(app.getHttpServer())
      .post('/media/upload-url')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ base64: Buffer.from('abc').toString('base64'), filename: 'file.jpg', mimetype: 'image/jpeg' })
      .expect(201);
    const r1 = await upload();
    const r2 = await upload();
    image1 = r1.body;
    image2 = r2.body;

    // Create a listing for all tests
    const res = await request(app.getHttpServer())
      .post('/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'E2E Listing',
        description: 'Desc',
        price: 999,
        transaction_type: 'sell',
        price_unit: 'total',
        city: 'Addis',
        address: 'Addr',
        imageIds: [image1.id, image2.id],
        categoryId: category.id,
        propertyType: 'Apartment'
      })
      .expect(201);
    listing = res.body;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /listings creates a listing', async () => {
    expect(listing.id).toBeDefined();
    expect(Array.isArray(listing.images)).toBe(true);
    expect(listing.images.length).toBe(2);
  });

  it('GET /listings lists with pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/listings?limit=5&page=1')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(res.body.meta).toBeDefined();
    expect(Number(res.body.meta.limit)).toBe(5);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /listings/:id returns details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/listings/${listing.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(res.body.id).toBe(listing.id);
    expect(res.body.title).toBeDefined();
  });

  it('PATCH /listings/:id/status forbids non-admin and allows admin', async () => {
    await request(app.getHttpServer())
      .patch(`/listings/${listing.id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'approved' })
      .expect(403);

    const ok = await request(app.getHttpServer())
      .patch(`/listings/${listing.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(200);

    expect(ok.body.status).toBe('approved');
  });

  it('PATCH /listings/:id/media updates images', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/listings/${listing.id}/media`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ imageIds: [image1.id, image2.id] })
      .expect(200);

});
