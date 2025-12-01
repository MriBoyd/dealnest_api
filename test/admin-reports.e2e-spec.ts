import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/user/domain/entities/user.entity';
import { Listing } from '../src/modules/listings/domain/entities/listing.entity';
import { Report, ReportStatus } from '../src/modules/listings/domain/entities/report.entity';
import { Role } from '../src/common/enums/role.enum';
import { UpdateReportStatusDto } from '../src/modules/admin/presentation/dto/update-report-status.dto';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';


describe('AdminReportsController (e2e)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let authService: AuthService;
	let admin: User;
	let adminToken: string;
	let user: User;
	let listing: Listing;
	let report: Report;

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
		await dataSource.getRepository(Report).query('TRUNCATE TABLE "reports" RESTART IDENTITY CASCADE;');
		await dataSource.getRepository(Listing).query('TRUNCATE TABLE "listings" CASCADE;');
		await dataSource.getRepository(User).query('TRUNCATE TABLE "users" CASCADE;');

		// Create admin user
		admin = await dataSource.getRepository(User).save({
			email: 'admin_report@e2e.com',
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
		user = await dataSource.getRepository(User).save({
			email: 'user_report@e2e.com',
			name: 'User',
			role: Role.INDIVIDUAL_BUYER,
			is_email_verified: true,
		} as User);

		// Create a listing for the user
		listing = await dataSource.getRepository(Listing).save({
			title: 'Reported Listing',
			description: 'This listing is reported',
			price: 100,
			owner: user,
			city: 'Test City',
			address: 'Test Address',
			transaction_type: 'sell',
			price_unit: 'total',
		} as Listing);

		// Create a report for the listing
		report = await dataSource.getRepository(Report).save({
			reporter: user,
			reportedListing: listing,
			reason: 'some reason',
			status: ReportStatus.PENDING,
		} as Report);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('/admin/reports (GET)', () => {
		it('should return reports', async () => {
			const response = await request(app.getHttpServer())
				.get('/admin/reports')
				.set('Authorization', `Bearer ${adminToken}`)
				.expect(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBe(1);
			expect(String(response.body[0].id)).toBe(String(report.id));
			expect(response.body[0].status).toBe(ReportStatus.PENDING);
		});
	});

	describe('/admin/reports/:id/status (PATCH)', () => {
		it('should approve a report', async () => {
			const dto: UpdateReportStatusDto = { status: ReportStatus.APPROVED };
			const response = await request(app.getHttpServer())
				.patch(`/admin/reports/${report.id}/status`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send(dto)
				.expect(200);
			expect(response.body.status).toBe(ReportStatus.APPROVED);
		});
	});
});
