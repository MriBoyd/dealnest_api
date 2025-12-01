import { EmailVerification } from 'src/modules/email/domain/entities/email-verification.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ReviewsService } from '../../application/services/reviews.service';
import { Review } from '../../domain/entities/review.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { ReviewTargetType } from '../../domain/entities/review.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { Repository } from 'typeorm';
import { Role } from '../../../../common/enums/role.enum';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { UserService } from 'src/modules/user/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { Mailer } from 'src/modules/email/application/services/mailer';
import { PasswordResetToken } from 'src/modules/auth/domain/entities/password-reset-token.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailService } from 'src/modules/email/application/services/email.service';
import { ConfigService } from '@nestjs/config';
import { Report } from '../../../listings/domain/entities/report.entity';
import { TestUtils } from 'src/test/test-utils';

describe('Reviews Repository (Integration)', () => {
    let service: ReviewsService;
    let userRepo: Repository<User>;
    let moduleRef: TestingModule; // Declare moduleRef
    let testUtils: TestUtils; // Declare testUtils

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
                TypeOrmModule.forFeature([
                    Review,
                    Listing,
                    User,
                    PasswordResetToken,
                    EmailVerification,
                    Report,
                ]),
            ],
            providers: [
                ReviewsService,
                TestUtils,
                AuthService,
                UserService,
                JwtService,
                Mailer,
                EmailService,
                ConfigService,
                {
                    provide: getRepositoryToken(PasswordResetToken),
                    useValue: {}, // simple mock
                },
                {
                    provide: getRepositoryToken(EmailVerification),
                    useValue: {}, // simple mock
                },
            ],
        }).compile();

        service = moduleRef.get(ReviewsService);
        userRepo = moduleRef.get('UserRepository');
        testUtils = moduleRef.get<TestUtils>(TestUtils); // Get TestUtils instance
    });

    afterAll(async () => {
        await moduleRef.close(); // Close NestJS module
    });

    beforeEach(async () => {
        await testUtils.reloadFixtures(); // Ensure clean state before each test
    });

    it('should save and retrieve review in DB', async () => {
        const reviewer = await userRepo.save({ email: 'reviewer@test.com', name: 'John Doe', phone_number: '1234567890', is_email_verified: true, role: Role.INDIVIDUAL_BUYER });
        const seller = await userRepo.save({ email: 'seller@test.com', name: 'John Doe', phone_number: '1234567890', is_email_verified: true, role: Role.HOMEOWNER });

        const review = await service.createReview(reviewer, ReviewTargetType.SELLER, seller.id, 4, 'Good experience!');
        expect(review.id).toBeDefined();
    });
});
