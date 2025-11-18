import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/user/domain/entities/user.entity';
import { Role } from '../src/common/enums/role.enum';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { Listing } from '../src/modules/listings/domain/entities/listing.entity';
import { ListingImage } from '../src/modules/media/domain/entities/media.entity';

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    authService = app.get(AuthService);

    // Clean tables
    await dataSource.getRepository(ListingImage).query('TRUNCATE TABLE "listing_images" RESTART IDENTITY CASCADE;');
    await dataSource.getRepository(Listing).query('TRUNCATE TABLE "listings" CASCADE;');
    await dataSource.getRepository(User).query('TRUNCATE TABLE "users" CASCADE;');

    const userRepo = dataSource.getRepository(User);

    seller = await userRepo.save({ email: 'seller@e2e.com', name: 'Seller', role: Role.HOMEOWNER } as any);
    admin = await userRepo.save({ email: 'admin@e2e.com', name: 'Admin', role: Role.ADMIN } as any);

    sellerToken = (await authService.login({ id: seller.id, email: seller.email, name: seller.name, role: seller.role, is_email_verified: true } as any)).access_token;
    adminToken = (await authService.login({ id: admin.id, email: admin.email, name: admin.name, role: admin.role, is_email_verified: true } as any)).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /listings creates a listing', async () => {
    // create two media first
    const upload = async () => request(app.getHttpServer())
      .post('/media/upload-url')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ base64: Buffer.from('abc').toString('base64'), filename: 'file.jpg' })
      .expect(201);

    const r1 = await upload();
    const r2 = await upload();

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
        imageIds: [r1.body.id, r2.body.id],
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images.length).toBe(2);
  });

  it('GET /listings lists with pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/listings?limit=5&page=1')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.limit).toBe(5);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /listings/:id returns details', async () => {
    const repo = dataSource.getRepository(Listing);
    const listing = await repo.findOne({ where: {}, order: { created_at: 'DESC' } });

    const res = await request(app.getHttpServer())
      .get(`/listings/${listing!.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(res.body.id).toBe(listing!.id);
    expect(res.body.title).toBeDefined();
  });

  it('PATCH /listings/:id/status forbids non-admin and allows admin', async () => {
    const repo = dataSource.getRepository(Listing);
    const listing = await repo.findOne({ where: {}, order: { created_at: 'DESC' } });

    await request(app.getHttpServer())
      .patch(`/listings/${listing!.id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'approved' })
      .expect(403);

    const ok = await request(app.getHttpServer())
      .patch(`/listings/${listing!.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(200);

    expect(ok.body.status).toBe('approved');
  });

  it('PATCH /listings/:id/media updates images', async () => {
    const repo = dataSource.getRepository(Listing);
    const listing = await repo.findOne({ where: {}, order: { created_at: 'DESC' } });

    const upload = async () => request(app.getHttpServer())
      .post('/media/upload-url')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ base64: Buffer.from('def').toString('base64'), filename: 'file2.jpg' })
      .expect(201);

    const r1 = await upload();
    const r2 = await upload();

    const res = await request(app.getHttpServer())
      .patch(`/listings/${listing!.id}/media`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ imageIds: [r1.body.id, r2.body.id] })
      .expect(200);

    expect(res.body.images.length).toBe(2);
  });
});
