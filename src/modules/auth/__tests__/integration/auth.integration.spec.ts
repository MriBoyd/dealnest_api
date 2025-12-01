import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { AuthService } from '../../application/services/auth.service';
import { User } from '../../../user/domain/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { Mailer } from '../../../email/application/services/mailer';
import { UserService } from '../../../user/application/services/user.service';
import { EmailService } from '../../../email/application/services/email.service';
import { EmailVerification } from '../../../email/domain/entities/email-verification.entity';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { Review } from '../../../reviews/domain/entities/review.entity';
import { Report } from '../../../listings/domain/entities/report.entity';
import { TestUtils } from 'src/test/test-utils';


describe('AuthService (Integration)', () => {
	let service: AuthService;
	let users: Repository<User>;
	let moduleRef: TestingModule; // Declare moduleRef
	let testUtils: TestUtils; // Declare testUtils

	beforeAll(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
				TypeOrmModule.forFeature([User, PasswordResetToken, EmailVerification, Listing, Review, Report]),
				JwtModule.register({ secret: 'testsecret' }),
			],
			providers: [
				AuthService,
				UserService, // Use the real UserService
				{ provide: EmailService, useValue: { resendVerificationEmail: jest.fn() } }, // Mock EmailService for UserService
				{ provide: Mailer, useValue: { sendPasswordResetEmail: jest.fn() } },
				TestUtils, // Add TestUtils
			],
		}).compile();

		service = moduleRef.get(AuthService);
		users = moduleRef.get<Repository<User>>(getRepositoryToken(User));
		testUtils = moduleRef.get<TestUtils>(TestUtils); // Get TestUtils instance

		await testUtils.reloadFixtures(); // Use TestUtils to clear database
	});

	afterAll(async () => {
		await moduleRef.close(); // Close NestJS module
	});

	beforeEach(async () => {
		await testUtils.reloadFixtures(); // Ensure clean state before each test
	});

	it('requestPasswordReset saves token and expiry', async () => {
		await users.save({ email: 'int@a.com', name: 'Int', role: 'individual_buyer' } as User);
		const res = await service.requestPasswordReset({ email: 'int@a.com' });
		expect(res.message).toBeDefined();

		// Check PasswordResetToken entity for the user
		const prtRepo = moduleRef.get<Repository<PasswordResetToken>>(getRepositoryToken(PasswordResetToken));
		const user = await users.findOne({ where: { email: 'int@a.com' } });
		expect(user).toBeDefined();
		if (!user) throw new Error('User not found');
		const prt = await prtRepo.findOne({ where: { user: { id: user.id } } });
		expect(prt?.token).toBeDefined();
		expect(prt?.expires_at).toBeInstanceOf(Date);
	});

	it('resetPassword updates hash and clears fields', async () => {
		// Save user and create a valid PasswordResetToken
		const u = await users.save({ email: 'int2@a.com', name: 'Int2', role: 'individual_buyer' } as User);
		const prtRepo = moduleRef.get<Repository<PasswordResetToken>>(getRepositoryToken(PasswordResetToken));
		const token = 'valid-reset-token';
		const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
		await prtRepo.save(prtRepo.create({ user: u, token, expires_at, consumed_at: null }));

		const res = await service.resetPassword({ token, new_password: 'newpassword123' });
		expect(res.message).toContain('successful');

		const updated = await users.findOne({ where: { id: u.id } });
		expect(updated?.password_hash).toBeDefined();
		// Optionally, check that the token is now consumed
		const prt = await prtRepo.findOne({ where: { token } });
		expect(prt?.consumed_at).toBeInstanceOf(Date);
	});
});
