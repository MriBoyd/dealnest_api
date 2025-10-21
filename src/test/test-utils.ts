import { Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { User } from '../modules/user/domain/entities/user.entity';
import { Listing } from '../modules/listings/domain/entities/listing.entity';
import { Review } from '../modules/reviews/domain/entities/review.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../modules/auth/application/services/auth.service';

@Injectable()
export class TestUtils {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Listing) private readonly listingRepo: Repository<Listing>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    private readonly authService: AuthService,
  ) {}

  async reloadFixtures() {
    await this.reviewRepo.delete({});
    await this.listingRepo.delete({});
    await this.userRepo.delete({});
  }

  async createUser(email: string, password?: string): Promise<User> {
    const user = this.userRepo.create({
      email,
      password,
      first_name: 'Test',
      last_name: 'User',
    });
    return this.userRepo.save(user);
  }

  async login(email: string, password?: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error('User not found');
    return this.authService.login(user).then(res => res.access_token);
  }

  async createListing(owner: User, data: Partial<Listing>): Promise<Listing> {
    const listing = this.listingRepo.create({ ...data, owner });
    return this.listingRepo.save(listing);
  }

  async createReview(
    reviewer: User,
    listing: Listing | null,
    data: Partial<Review>,
    seller?: User,
  ): Promise<Review> {
    const review = this.reviewRepo.create({
      ...data,
      reviewer,
      listing,
      seller: seller || (listing ? listing.owner : undefined),
    });
    return this.reviewRepo.save(review);
  }
}