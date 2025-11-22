import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserService } from '../../application/services/user.service';
import { User } from '../../domain/entities/user.entity';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { CreateUserDto } from '../../presentation/dto/create-user.dto';
import { Role } from '../../../../common/enums/role.enum';
import { ConflictException } from '@nestjs/common';
import { EmailService } from 'src/modules/email/application/services/email.service';
import { EmailVerification } from 'src/modules/email/domain/entities/email-verification.entity';
import { TestUtils } from 'src/test/test-utils';
import { Listing } from 'src/modules/listings/domain/entities/listing.entity';
import { Review } from 'src/modules/reviews/domain/entities/review.entity';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { Mailer } from 'src/modules/email/application/services/mailer';
import { PasswordResetToken } from 'src/modules/auth/domain/entities/password-reset-token.entity';

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
				TypeOrmModule.forFeature([User, EmailVerification, Listing, Review, PasswordResetToken]),
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
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};

		const result = await service.createUser(createUserDto);
		expect(result).toHaveProperty('id');

		const dbUser = await service.findUserByEmail('test@example.com');
		expect(dbUser).toBeDefined();
		expect(dbUser!.email).toEqual('test@example.com');
	});

	it('should not create a user if email already exists', async () => {
		const createUserDto: CreateUserDto = {
			email: 'test@example.com',
			password: 'password123',
			name: 'Test User',
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
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};
		const user = await service.createUser(createUserDto);

		const updatedUser = await service.updateProfile(user.id, { name: 'Updated Name' });
		expect(updatedUser.name).toEqual('Updated Name');

		const dbUser = await service.findUserById(user.id);
		expect(dbUser.name).toEqual('Updated Name');
	});

	it('should delete a user profile', async () => {
		const createUserDto: CreateUserDto = {
			email: 'test@example.com',
			password: 'password123',
			name: 'Test User',
			role: Role.INDIVIDUAL_BUYER,
			phone_number: '1234567890',
		};
		const user = await service.createUser(createUserDto);

		await service.deleteProfile(user.id);

		await expect(service.findUserById(user.id)).rejects.toThrow();
	});
});