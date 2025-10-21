import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from '../../application/services/reviews.service';
import { Review } from '../../domain/entities/review.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { ReviewTargetType } from '../../domain/entities/review.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { Repository } from 'typeorm';
import { Role } from '../../../../common/enums/role.enum';
import { Vertical } from '../../../listings/domain/enums/vertical.enum';
import { ForbiddenException } from '@nestjs/common';

describe('Reviews Approval (Integration)', () => {
    let service: ReviewsService;
    let userRepo: Repository<User>;
    let reviewRepo: Repository<Review>;
    let listingRepo: Repository<Listing>;
    let admin: User;
    let user: User;
    let listing: Listing;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(testDatabaseConfig),
                TypeOrmModule.forFeature([Review, Listing, User]),
            ],
            providers: [ReviewsService],
        }).compile();

        service = moduleRef.get(ReviewsService);
        userRepo = moduleRef.get('UserRepository');
        reviewRepo = moduleRef.get('ReviewRepository');
        listingRepo = moduleRef.get('ListingRepository');

        await reviewRepo.query('TRUNCATE TABLE \"reviews\" CASCADE;');
        await listingRepo.query('TRUNCATE TABLE \"listings\" CASCADE;');
        await userRepo.query('TRUNCATE TABLE \"users\" CASCADE;');

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
            vertical: Vertical.NEW_CAR,
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
        await service.createReview(
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

        const reviews = await service.getListingReviews(listing.id);
        expect(reviews.length).toBe(1);
        expect(reviews[0].is_approved).toBe(true);
    });
});