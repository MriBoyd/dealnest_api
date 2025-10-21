
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from '../../presentation/reviews.controller';
import { ReviewsService } from '../../application/services/reviews.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { User } from '../../../user/domain/entities/user.entity';
import { ReviewTargetType } from '../../domain/entities/review.entity';
import { Role } from '../../../../common/enums/role.enum';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  const mockReviewsService = {
    createReview: jest.fn(),
    getListingReviews: jest.fn(),
    getSellerReviews: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReview', () => {
    it('should create a review', async () => {
      const user = { id: '1', role: Role.INDIVIDUAL_BUYER } as User;
      const body = {
        targetType: ReviewTargetType.LISTING,
        targetId: 'listing-id',
        rating: 5,
        comment: 'Great product!',
      };
      const expectedResult = { id: '1', ...body };

      mockReviewsService.createReview.mockResolvedValue(expectedResult);

      const result = await controller.createReview(user, body);

      expect(service.createReview).toHaveBeenCalledWith(
        user,
        body.targetType,
        body.targetId,
        body.rating,
        body.comment,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getListingReviews', () => {
    it('should return listing reviews', async () => {
      const listingId = 'listing-id';
      const expectedResult = [{ id: '1' }];

      mockReviewsService.getListingReviews.mockResolvedValue(expectedResult);

      const result = await controller.getListingReviews(listingId);

      expect(service.getListingReviews).toHaveBeenCalledWith(listingId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSellerReviews', () => {
    it('should return seller reviews', async () => {
      const sellerId = 'seller-id';
      const expectedResult = [{ id: '1' }];

      mockReviewsService.getSellerReviews.mockResolvedValue(expectedResult);

      const result = await controller.getSellerReviews(sellerId);

      expect(service.getSellerReviews).toHaveBeenCalledWith(sellerId);
      expect(result).toEqual(expectedResult);
    });
  });
});
