import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/user/domain/entities/user.entity';
import { Listing } from '../modules/listings/domain/entities/listing.entity';
import { Review } from '../modules/reviews/domain/entities/review.entity';
import { Report } from '../modules/listings/domain/entities/report.entity';
import { DataSource, Repository } from 'typeorm';
import { AuthService } from '../modules/auth/application/services/auth.service';
import { Role } from '../common/enums/role.enum';
import { UserMapper } from '../modules/user/application/mappers/user.mapper';

@Injectable()
export class TestUtils {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Listing) private readonly listingRepo: Repository<Listing>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Report) private readonly reportRepo: Repository<Report>,
    private readonly authService: AuthService,
    private readonly dataSource: DataSource,
  ) {}

  async reloadFixtures() {
    const entities = this.dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
    }
  }

  // Remove closeDbConnection method

  async createUser(email: string): Promise<User> {
    const user = this.userRepo.create({
      email,
      name: 'Test User',
      phone_number: null,
      role: Role.INDIVIDUAL_BUYER,
      is_email_verified: true,
    } as Partial<User>);
    return this.userRepo.save(user as User);
  }

  async login(email: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error('User not found');
    const dto = UserMapper.toResponse(user);
    return this.authService.login(dto).then(res => res.access_token);
  }

  async createListing(owner: User, data: Partial<Listing>): Promise<Listing> {
    const listing = this.listingRepo.create({
      title: data.title || 'Listing Title',
      description: data.description,
      price: data.price || 100,
      currency: data.currency || 'ETB',
      city: (data as Listing).city || 'Addis',
      address: (data as Listing).address || 'Address',
      owner,
    });
    return this.listingRepo.save(listing);
  }

  async createReview(
    reviewer: User,
    listing: Listing | null,
    data: Partial<Review>,
    seller?: User,
  ): Promise<Review> {
    const review = this.reviewRepo.create({
      reviewer,
      listing: listing || undefined,
      seller: seller || (listing ? listing.owner : undefined),
      target_type: data.target_type || 'listing',
      rating: data.rating || 5,
      comment: data.comment,
    } as Review);
    return this.reviewRepo.save(review as Review);
  }

  async createReport(
    reporter: User,
    reportedListing: Listing,
    data: Partial<Report>,
  ): Promise<Report> {
    const report = this.reportRepo.create({
      reporter,
      reportedListing,
      reason: data.reason || 'Test Report Reason',
    } as Report);
    return this.reportRepo.save(report);
  }
}
