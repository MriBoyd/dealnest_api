import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserService } from '../../application/services/user.service';
import { User } from '../../domain/entities/user.entity';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { CreateUserDto } from '../../presentation/dto/create-user.dto';
import { Role } from '../../../../common/enums/role.enum';
import { ConflictException } from '@nestjs/common';
import { EmailService } from '../../../email/application/services/email.service';
import { EmailVerification } from 'src/modules/email/domain/entities/email-verification.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { Review } from '../../../reviews/domain/entities/review.entity';
import { AuthService } from '../../../auth/application/services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { Mailer } from '../../..//email/application/services/mailer';
import { PasswordResetToken } from '../../..//auth/domain/entities/password-reset-token.entity';
import { Report } from '../../../listings/domain/entities/report.entity';
import { TestUtils } from 'src/test/test-utils';

class MockEmailService {
	generateAndSendVerificationToken = jest.fn().mockResolvedValue(undefined);
}

describe('UserService (Integration)', () => {
	let service: UserService;
	let module: TestingModule;
	let testUtils: TestUtils; // Declare testUtils

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
								TypeOrmModule.forFeature([
									User, EmailVerification, Listing, Review, PasswordResetToken,
									Report,
								]),
				JwtModule.register({ secret: 'testsecret' }),
			],
			providers: [
				UserService,
				AuthService,
				{ provide: EmailService, useClass: MockEmailService },
				{ provide: Mailer, useValue: { sendPasswordResetEmail: jest.fn() } },
				TestUtils, // Add TestUtils to providers
			],
		}).compile();

		service = module.get<UserService>(UserService);
		testUtils = module.get<TestUtils>(TestUtils); // Get TestUtils instance
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		await testUtils.reloadFixtures(); // Use reloadFixtures from TestUtils
	});

	it('should create a user and save to the database', async () => {
		const createUserDto: CreateUserDto = {
			email: 'test@example.com',
			password: 'password123',
			name: 'Test User',
			business_name: 'Test Business',
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};

		const result = await service.createUser(createUserDto);
		expect(result).toHaveProperty('id');

		const dbUser = await service.findUserByEmail('test@example.com');
		expect(dbUser).toBeDefined();
		expect(dbUser!.email).toEqual('test@example.com');
		expect(dbUser!.business_name).toEqual('Test Business');
	});

	it('should not create a user if email already exists', async () => {
		const createUserDto: CreateUserDto = {
			email: 'test@example.com',
			password: 'password123',
			name: 'Test User',
			business_name: 'Test Business',
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};
		await service.createUser(createUserDto);

		await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
	});

	it('should find a user by id', async () => {
		const createUserDto: CreateUserDto = {
			email: 'test@example.com',
			password: 'password123',
			name: 'Test User',
			business_name: 'Test Business',
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};
		const user = await service.createUser(createUserDto);

		const foundUser = await service.findUserById(user.id);
		expect(foundUser).toBeDefined();
		expect(foundUser.id).toEqual(user.id);
	});

	it('should update a user profile', async () => {
		const createUserDto: CreateUserDto = {
			email: 'test@example.com',
			password: 'password123',
			name: 'Test User',
			business_name: 'Test Business',
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};
		const user = await service.createUser(createUserDto);

		const updatedUser = await service.updateProfile(user.id, { name: 'Updated Name', business_name: 'Updated Business' });
		expect(updatedUser.name).toEqual('Updated Name');
		expect(updatedUser.business_name).toEqual('Updated Business');

		const dbUser = await service.findUserById(user.id);
		expect(dbUser.name).toEqual('Updated Name');
		expect(dbUser.business_name).toEqual('Updated Business');
	});

	it('should delete a user profile', async () => {
		const createUserDto: CreateUserDto = {
			email: 'test@example.com',
			password: 'password123',
			name: 'Test User',
			business_name: 'Test Business',
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};
		const user = await service.createUser(createUserDto);

		await service.deleteProfile(user.id);

		await expect(service.findUserById(user.id)).rejects.toThrow();
	});
});