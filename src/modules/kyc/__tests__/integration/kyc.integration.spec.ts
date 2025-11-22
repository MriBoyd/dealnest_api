import { Test, TestingModule } from '@nestjs/testing';
import { KycModule } from '../../kyc.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { UserService } from 'src/modules/user/application/services/user.service';
import { EmailService } from 'src/modules/email/application/services/email.service';
import { Mailer } from 'src/modules/email/application/services/mailer';
import { ConfigService } from '@nestjs/config';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { TestUtils } from 'src/test/test-utils';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { Review } from '../../../reviews/domain/entities/review.entity';

describe('KycModule Integration', () => {
  let moduleRef: TestingModule; // Change to moduleRef
  let dataSource: DataSource;
  let testUtils: TestUtils; // Declare testUtils

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
        TypeOrmModule.forFeature([User, Listing, Review]),
        KycModule,
      ],
      providers: [
        TestUtils,
        { provide: AuthService, useValue: { login: jest.fn() } },
        { provide: UserService, useValue: { findUserByEmail: jest.fn(), createUser: jest.fn() } },
        { provide: EmailService, useValue: { generateAndSendVerificationToken: jest.fn() } },
        { provide: Mailer, useValue: { sendPasswordResetEmail: jest.fn(), sendVerificationEmail: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Listing), useValue: {} },
        { provide: getRepositoryToken(Review), useValue: {} },
      ],
    }).compile();
    dataSource = moduleRef.get<DataSource>(DataSource);
    testUtils = moduleRef.get<TestUtils>(TestUtils); // Get TestUtils instance

    await testUtils.reloadFixtures(); // Use TestUtils to clear database
  });

  afterAll(async () => {
    await moduleRef.close(); // Only close moduleRef, globalTeardown handles DataSource
  });

  beforeEach(async () => {
    await testUtils.reloadFixtures(); // Ensure clean state before each test
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined(); // Use moduleRef
  });

  // Add integration tests for user KYC flows only
  it('should upload KYC docs and get status (stub)', async () => {
    // You can implement a real test here using the real DB and KycService
    expect(true).toBe(true);
  });
});
