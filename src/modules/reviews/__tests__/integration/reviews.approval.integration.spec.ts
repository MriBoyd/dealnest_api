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
import { ForbiddenException } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { EmailService } from 'src/modules/email/application/services/email.service';
import { UserService } from 'src/modules/user/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { Mailer } from 'src/modules/email/application/services/mailer';
import { PasswordResetToken } from 'src/modules/auth/domain/entities/password-reset-token.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Report } from '../../../listings/domain/entities/report.entity';
import { TestUtils } from 'src/test/test-utils';

describe('Reviews Approval (Integration)', () => {
    let service: ReviewsService;
    let userRepo: Repository<User>;
    let reviewRepo: Repository<Review>;
    let listingRepo: Repository<Listing>;
    let admin: User;
    let user: User;
    let listing: Listing;
    let moduleRef: TestingModule; // Declare moduleRef
    let testUtils: TestUtils; // Declare testUtils

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
                                TypeOrmModule.forFeature([
                                    Review, Listing, User, PasswordResetToken, EmailVerification,
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
                {
                    provide: getRepositoryToken(PasswordResetToken),
                    useValue: {}, // simple mock
                },
                {
                    provide: getRepositoryToken(EmailVerification),
                    useValue: {}, // simple mock
                },
                ConfigService,
            ],
        }).compile();

        service = moduleRef.get(ReviewsService);
        userRepo = moduleRef.get('UserRepository');
        reviewRepo = moduleRef.get('ReviewRepository');
        listingRepo = moduleRef.get('ListingRepository');
        testUtils = moduleRef.get<TestUtils>(TestUtils); // Get TestUtils instance
    });

    afterAll(async () => {
        await moduleRef.close(); // Close NestJS module
    });

    beforeEach(async () => {
        await testUtils.reloadFixtures(); // Ensure clean state before each test
        
        admin = await userRepo.save({
            email: 'admin@test.com',
            name: 'Test',
            role: Role.ADMIN,
        });

        user = await userRepo.save({
            email: 'user@test.com',
            name: 'Test',
            role: Role.INDIVIDUAL_BUYER,
        });

        const seller = await userRepo.save({
            email: 'seller@test.com',
            name: 'Test',
            role: Role.HOMEOWNER,
        });

        listing = await listingRepo.save({
            title: 'Test Listing',
            description: 'Test Description',
            price: 100,
            currency: 'ETB',
            city: 'Addis Ababa',
            address: 'Test Address',
            owner: seller,
        });
    });

    it('should only allow admins to approve reviews', async () => {
        const review = await service.createReview(
            user,
            ReviewTargetType.LISTING,
            listing.id,
            5,
            'Excellent!',
        );

        await expect(service.approveReview(user, review.id, true)).rejects.toThrow(
            ForbiddenException,
        );
    });

    it('should approve a review', async () => {
        const review = await service.createReview(
            user,
            ReviewTargetType.LISTING,
            listing.id,
            5,
            'Excellent!',
        );

        const approvedReview = await service.approveReview(admin, review.id, true);
        expect(approvedReview.is_approved).toBe(true);

        const fetchedReview = await reviewRepo.findOne({ where: { id: review.id } });
        expect(fetchedReview).toBeDefined();
        expect(fetchedReview?.is_approved).toBe(true);
    });

    it('should disapprove a review', async () => {
        const review = await service.createReview(
            user,
            ReviewTargetType.LISTING,
            listing.id,
            5,
            'Excellent!',
        );

        const disapprovedReview = await service.approveReview(admin, review.id, false);
        expect(disapprovedReview.is_approved).toBe(false);

        const fetchedReview = await reviewRepo.findOne({ where: { id: review.id } });
        expect(fetchedReview).toBeDefined();
        expect(fetchedReview?.is_approved).toBe(false);
    });

    it('should only return approved reviews', async () => {
        const review1 = await service.createReview(
            user,
            ReviewTargetType.LISTING,
            listing.id,
            5,
            'Excellent!',

        );

        await service.createReview(
            user,
            ReviewTargetType.LISTING,
            listing.id,
            4,
            'Good',
        );

        await service.approveReview(admin, review1.id, true);

        const reviews = await service.getListingReviews(listing.id);
        expect(reviews.length).toBe(1);
        expect(reviews[0].is_approved).toBe(true);
        expect(reviews[0].id).toBe(review1.id);
    });
});