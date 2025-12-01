import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/user/domain/entities/user.entity';
import { Listing, ListingStatus } from '../src/modules/listings/domain/entities/listing.entity';
import { Role } from '../src/common/enums/role.enum';
import { UpdateListingStatusDto } from 'src/modules/admin/presentation/dto/update-listing-status.dto';
import { AdminActionType } from 'src/modules/admin/domain/entities/admin-action.entity';
import { Category } from '../src/modules/listings/domain/entities/category.entity';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';



describe('AdminListingsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  let admin: User;
  let adminToken: string;
  let listing: Listing;
  let category: Category;

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

    // Clean up tables
    await dataSource.getRepository(Listing).query('TRUNCATE TABLE "listings" CASCADE;');
    await dataSource.getRepository(User).query('TRUNCATE TABLE "users" CASCADE;');
    await dataSource.getRepository(Category).query('TRUNCATE TABLE "categories" RESTART IDENTITY CASCADE;');

    // Create category
    category = await dataSource.getRepository(Category).save({ name: 'Real Estate', slug: 'real-estate' });

    // Create admin user
    admin = await dataSource.getRepository(User).save({
      email: 'admin@e2e.com',
      name: 'Admin',
      role: Role.ADMIN,
      is_email_verified: true,
    } as User);

    // Login admin
    adminToken = (await authService.login({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      is_email_verified: true,
      preferred_language: admin.preferred_language,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
    })).access_token;

    // Create a regular user
    const user = await dataSource.getRepository(User).save({
      email: 'user@e2e.com',
      name: 'User',
      role: Role.HOMEOWNER,
      is_email_verified: true,
    } as User);

    // Create a listing for the user
    listing = await dataSource.getRepository(Listing).save({
      title: 'Test Listing',
      description: 'Test Desc',
      price: 100,
      status: ListingStatus.PENDING_VERIFICATION,
      owner: user,
      city: 'Test City',
      address: 'Test Address',
      transaction_type: 'sell',
      price_unit: 'total',
      category: category,
    } as Listing);
  });

  afterAll(async () => {
    await app.close();
  });


  describe('/admin/listings (GET)', () => {
    it('should return listings pending verification', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/listings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(listing.id);
      expect(response.body[0].status).toBe(ListingStatus.PENDING_VERIFICATION);
    });
  });

  describe('/admin/listings/:id/status (PATCH)', () => {
    it('should approve a listing', async () => {
      const dto: UpdateListingStatusDto = {
        action_type: AdminActionType.APPROVE,
        notes: 'Approved',
      };
      const response = await request(app.getHttpServer())
        .patch(`/admin/listings/${listing.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dto)
        .expect(200);
      expect(response.body.status).toBe(ListingStatus.ACTIVE);
    });
  });
});
