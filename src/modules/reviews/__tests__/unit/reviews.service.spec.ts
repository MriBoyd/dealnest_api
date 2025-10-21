import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from '../../application/services/reviews.service';
import { Review, ReviewTargetType } from '../../domain/entities/review.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Role } from '../../../../common/enums/role.enum';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: Repository<Review>;
  let listingRepository: Repository<Listing>;

  const mockReviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockListingRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(Listing),
          useValue: mockListingRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get<Repository<Review>>(getRepositoryToken(Review));
    listingRepository = module.get<Repository<Listing>>(getRepositoryToken(Listing));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    const reviewer = { id: '1', role: Role.INDIVIDUAL_BUYER } as User;
    const targetId = 'listing-id';
    const rating = 5;
    const comment = 'Great product!';

    it('should throw ForbiddenException for invalid rating', async () => {
      await expect(
        service.createReview(reviewer, ReviewTargetType.LISTING, targetId, 0, comment),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a review for a listing', async () => {
      const listing = { id: targetId, owner: { id: 'seller-id' } } as Listing;
      const review = {
        reviewer,
        target_type: ReviewTargetType.LISTING,
        rating,
        comment,
        listing,
        seller: listing.owner,
      };

      mockListingRepository.findOne.mockResolvedValue(listing);
      mockReviewRepository.create.mockReturnValue(review);
      mockReviewRepository.save.mockResolvedValue(review);

      const result = await service.createReview(
        reviewer,
        ReviewTargetType.LISTING,
        targetId,
        rating,
        comment,
      );

      expect(mockListingRepository.findOne).toHaveBeenCalledWith({ where: { id: targetId } });
      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        reviewer,
        target_type: ReviewTargetType.LISTING,
        rating,
        comment,
      });
      expect(mockReviewRepository.save).toHaveBeenCalledWith(review);
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException if listing not found', async () => {
      mockListingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(reviewer, ReviewTargetType.LISTING, targetId, rating, comment),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a review for a seller', async () => {
      const sellerId = 'seller-id';
      const review = {
        reviewer,
        target_type: ReviewTargetType.SELLER,
        rating,
        comment,
        seller: { id: sellerId },
      };

      mockReviewRepository.create.mockReturnValue(review);
      mockReviewRepository.save.mockResolvedValue(review);

      const result = await service.createReview(
        reviewer,
        ReviewTargetType.SELLER,
        sellerId,
        rating,
        comment,
      );

      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        reviewer,
        target_type: ReviewTargetType.SELLER,
        rating,
        comment,
      });
      expect(mockReviewRepository.save).toHaveBeenCalledWith(review);
      expect(result).toEqual(review);
    });
  });

  describe('getListingReviews', () => {
    it('should return reviews for a listing', async () => {
      const listingId = 'listing-id';
      const reviews = [{ id: '1' }, { id: '2' }] as Review[];
      mockReviewRepository.find.mockResolvedValue(reviews);

      const result = await service.getListingReviews(listingId);

      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        where: { listing: { id: listingId }, is_approved: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(reviews);
    });
  });

  describe('getSellerReviews', () => {
    it('should return reviews for a seller', async () => {
      const sellerId = 'seller-id';
      const reviews = [{ id: '1' }, { id: '2' }] as Review[];
      mockReviewRepository.find.mockResolvedValue(reviews);

      const result = await service.getSellerReviews(sellerId);

      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        where: {
          seller: { id: sellerId },
          target_type: ReviewTargetType.SELLER,
          is_approved: true,
        },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(reviews);
    });
  });

  describe('getAllReviews', () => {
    it('should return all reviews', async () => {
      const reviews = [{ id: '1' }, { id: '2' }] as Review[];
      mockReviewRepository.find.mockResolvedValue(reviews);

      const result = await service.getAllReviews();

      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(reviews);
    });
  });

  describe('approveReview', () => {
    const admin = { id: 'admin-id', role: Role.ADMIN } as User;
    const reviewId = 'review-id';

    it('should throw ForbiddenException if user is not an admin', async () => {
      const nonAdmin = { id: 'user-id', role: Role.INDIVIDUAL_BUYER } as User;
      await expect(service.approveReview(nonAdmin, reviewId, true)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if review not found', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);
      await expect(service.approveReview(admin, reviewId, true)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should approve a review', async () => {
      const review = { id: reviewId, is_approved: false } as Review;
      mockReviewRepository.findOne.mockResolvedValue(review);
      mockReviewRepository.save.mockResolvedValue({ ...review, is_approved: true });

      const result = await service.approveReview(admin, reviewId, true);

      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({ where: { id: reviewId } });
      expect(review.is_approved).toBe(true);
      expect(mockReviewRepository.save).toHaveBeenCalledWith(review);
      expect(result.is_approved).toBe(true);
    });

    it('should disapprove a review', async () => {
      const review = { id: reviewId, is_approved: true } as Review;
      mockReviewRepository.findOne.mockResolvedValue(review);
      mockReviewRepository.save.mockResolvedValue({ ...review, is_approved: false });

      const result = await service.approveReview(admin, reviewId, false);

      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({ where: { id: reviewId } });
      expect(review.is_approved).toBe(false);
      expect(mockReviewRepository.save).toHaveBeenCalledWith(review);
      expect(result.is_approved).toBe(false);
    });
  });
});