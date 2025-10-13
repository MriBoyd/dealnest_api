import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './domain/entities/review.entity';
import { Listing } from '../listings/domain/entities/listing.entity';
import { ReviewsService } from './application/services/reviews.service';
import { ReviewsController } from './presentation/reviews.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Review, Listing])],
    controllers: [ReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule { }