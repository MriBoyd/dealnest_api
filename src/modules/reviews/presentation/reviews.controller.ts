import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from '../application/services/reviews.service';
import { User } from '../../user/domain/entities/user.entity';
import { ReviewTargetType } from '../domain/entities/review.entity';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    async createReview(
        @CurrentUser() user: User,
        @Body() body: { targetType: ReviewTargetType; targetId: string; rating: number; comment?: string },
    ) {
        return this.reviewsService.createReview(user, body.targetType, body.targetId, body.rating, body.comment);
    }

    @Get('listing/:listingId')
    async getListingReviews(@Param('listingId') listingId: string) {
        return this.reviewsService.getListingReviews(listingId);
    }

    @Get('seller/:sellerId')
    async getSellerReviews(@Param('sellerId') sellerId: string) {
        return this.reviewsService.getSellerReviews(sellerId);
    }
}
