import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { ReviewsService } from 'src/modules/reviews/application/services/reviews.service';
import { User } from 'src/modules/user/domain/entities/user.entity';
;

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard)
export class AdminReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Get()
    async listAll() {
        return this.reviewsService.getAllReviews();
    }

    @Patch(':id/approve')
    async approveReview(
        @Param('id') id: string,
        @Body('approve') approve: boolean,
        @CurrentUser() admin: User,
    ) {
        return this.reviewsService.approveReview(admin, id, approve);
    }
}
