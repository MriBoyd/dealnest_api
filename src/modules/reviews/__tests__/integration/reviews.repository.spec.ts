import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from '../../application/services/reviews.service';
import { Review } from '../../domain/entities/review.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { ReviewTargetType } from '../../domain/entities/review.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { Repository } from 'typeorm';
import { Role } from '../../../../common/enums/role.enum';

describe('Reviews Repository (Integration)', () => {
    let service: ReviewsService;
    let userRepo: Repository<User>;

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
    });

    it('should save and retrieve review in DB', async () => {
        const reviewer = await userRepo.save({ email: 'reviewer@test.com', name: 'John Doe', phone_number: '1234567890', is_email_verified: true, role: Role.INDIVIDUAL_BUYER });
        const seller = await userRepo.save({ email: 'seller@test.com', name: 'John Doe', phone_number: '1234567890', is_email_verified: true, role: Role.HOMEOWNER });

        const review = await service.createReview(reviewer, ReviewTargetType.SELLER, seller.id, 4, 'Good experience!');
        expect(review.id).toBeDefined();
    });
});
