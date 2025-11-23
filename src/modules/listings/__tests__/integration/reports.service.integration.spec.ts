import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../auth/application/services/auth.service';
import { UserService } from '../../../user/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { Mailer } from '../../../email/application/services/mailer';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { ReportsService } from '../../application/services/reports.service';
import { Report } from '../../domain/entities/report.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../domain/entities/listing.entity';
import { Repository } from 'typeorm';
import { TestUtils } from '../../../../test/test-utils';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateReportDto } from '../../presentation/dto/create-report.dto';
import { PasswordResetToken } from '../../../auth/domain/entities/password-reset-token.entity';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../../../../common/enums/role.enum';
import { Category } from '../../domain/entities/category.entity';
import { RealEstateAttribute } from '../../domain/entities/real-estate.entity';
import { VehicleAttribute } from '../../domain/entities/vehicle.entity';
import { ListingImage } from '../../../media/domain/entities/media.entity';
import { Review } from '../../../reviews/domain/entities/review.entity';
import { EmailService } from '../../../email/application/services/email.service';
import { ConfigService } from '@nestjs/config';
import { EmailVerification } from '../../../email/domain/entities/email-verification.entity';

describe('ReportsService (Integration)', () => {
	let service: ReportsService;
	let reportRepo: Repository<Report>;
	let userRepo: Repository<User>;
	let listingRepo: Repository<Listing>;
	let moduleRef: TestingModule;
	let testUtils: TestUtils;

	beforeAll(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
				TypeOrmModule.forFeature([
					Report, User, Listing, Category, RealEstateAttribute, VehicleAttribute, ListingImage, Review, PasswordResetToken, EmailVerification
				]),
			],
			providers: [
				ReportsService,
				TestUtils,
				AuthService,
				UserService,
				JwtService,
				EmailService,
				ConfigService,
				{ provide: Mailer, useValue: { sendMail: jest.fn() } },
				{ provide: getRepositoryToken(PasswordResetToken), useValue: {} },
				{ provide: getRepositoryToken(EmailVerification), useValue: {} },
			],
		}).compile();

		service = moduleRef.get(ReportsService);
		reportRepo = moduleRef.get(getRepositoryToken(Report));
		userRepo = moduleRef.get(getRepositoryToken(User));
		listingRepo = moduleRef.get(getRepositoryToken(Listing));
		testUtils = moduleRef.get<TestUtils>(TestUtils);

		await testUtils.reloadFixtures();
	});

	afterAll(async () => {
		await moduleRef.close();
	});

	beforeEach(async () => {
		await testUtils.reloadFixtures();
	});

	describe('create', () => {
		it('should create a report and save it to the database', async () => {
			const reporter = await userRepo.save({
				email: 'reporter@test.com',
				name: 'Reporter',
				role: Role.INDIVIDUAL_BUYER,
			} as User);
			const listing = await listingRepo.save({
				title: 'Test Listing',
				description: 'A listing to be reported',
				price: 100,
				city: 'Test City',
				address: 'Test Address',
			} as Listing);

			const createReportDto: CreateReportDto = {
				reason: 'This is a test report.',
				reportedListingId: listing.id,
			};

			const result = await service.create(createReportDto, reporter);

			expect(result).toBeDefined();
			expect(result.reason).toEqual(createReportDto.reason);

			const savedReport = await reportRepo.findOne({ where: { id: result.id }, relations: ['reporter', 'reportedListing'] });
			expect(savedReport).toBeDefined();
			expect(savedReport?.reporter.id).toEqual(reporter.id);
			expect(savedReport?.reportedListing.id).toEqual(listing.id);
		});

		it('should throw NotFoundException if reported listing does not exist', async () => {
			const reporter = await userRepo.save({
				email: 'reporter@test.com',
				name: 'Reporter',
				role: Role.INDIVIDUAL_BUYER,
			} as User);

			const createReportDto: CreateReportDto = {
				reason: 'This listing does not exist.',
				reportedListingId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
			};

			await expect(service.create(createReportDto, reporter)).rejects.toThrow(NotFoundException);
		});
	});
});
