import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewTargetType } from '../../domain/entities/review.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
        @InjectRepository(Listing) private readonly listingRepo: Repository<Listing>,
    ) { }

    async createReview(
        reviewer: User,
        targetType: ReviewTargetType,
        targetId: string,
        rating: number,
        comment?: string,
    ) {
        if (rating < 1 || rating > 5) throw new ForbiddenException('Rating must be between 1 and 5');

        const review = this.reviewRepo.create({
            reviewer,
            target_type: targetType,
            rating,
            comment,
        });

        if (targetType === ReviewTargetType.LISTING) {
            const listing = await this.listingRepo.findOne({ where: { id: targetId } });
            if (!listing) throw new NotFoundException('Listing not found');
            review.listing = listing;
            review.seller = listing.owner;
        } else if (targetType === ReviewTargetType.SELLER) {
            review.seller = { id: targetId } as User;
        }

        return this.reviewRepo.save(review);
    }

    async getListingReviews(listingId: string) {
        return this.reviewRepo.find({
            where: { listing: { id: listingId }, is_approved: true },
            order: { created_at: 'DESC' },
        });
    }

    async getSellerReviews(sellerId: string) {
        return this.reviewRepo.find({
            where: { seller: { id: sellerId }, target_type: ReviewTargetType.SELLER, is_approved: true },
            order: { created_at: 'DESC' },
        });
    }

    async getAllReviews() {
        return this.reviewRepo.find({ order: { created_at: 'DESC' } });
    }

    async approveReview(admin: User, id: string, approve: boolean) {
        if (admin.role !== 'admin') throw new ForbiddenException('Only admins can approve reviews');
        const review = await this.reviewRepo.findOne({ where: { id } });
        if (!review) throw new NotFoundException('Review not found');
        review.is_approved = approve;
        return this.reviewRepo.save(review);
    }
}
