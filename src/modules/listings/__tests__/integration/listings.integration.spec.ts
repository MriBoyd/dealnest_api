import { EmailVerification } from '../../../email/domain/entities/email-verification.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions, getRepositoryToken } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { ListingsService } from '../../application/services/listings.service';
import { Listing } from '../../domain/entities/listing.entity';
import { ListingImage } from '../../../media/domain/entities/media.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../../../../common/enums/role.enum';
import { ListingStatus } from '../../domain/enums/listing-status.enum';
import { UpdateListingMediaDto } from '../../presentation/dto/update-listing-media.dto';
import { UpdateListingStatusDto } from '../../presentation/dto/update-listing-status.dto';
import { Review } from '../../../reviews/domain/entities/review.entity';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { UserService } from 'src/modules/user/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { Mailer } from 'src/modules/email/application/services/mailer';
import { PasswordResetToken } from 'src/modules/auth/domain/entities/password-reset-token.entity';
import { EmailService } from 'src/modules/email/application/services/email.service';
import { ConfigService } from '@nestjs/config';
import { Category } from '../../domain/entities/category.entity';
import { RealEstateAttribute } from '../../domain/entities/real-estate.entity';
import { VehicleAttribute } from '../../domain/entities/vehicle.entity';
import { CreateListingDto } from '../../presentation/dto/create-listing.dto';
import { PriceUnit } from '../../domain/enums/price-unit.enum';
import { TransactionType } from '../../domain/enums/transaction-type.enum';
import { Report } from '../../domain/entities/report.entity';
import { TestUtils } from 'src/test/test-utils';


describe('ListingsService (Integration)', () => {
  let service: ListingsService;
  let userRepo: Repository<User>;
  let listingRepo: Repository<Listing>;
  let imageRepo: Repository<ListingImage>;
  let categoryRepo: Repository<Category>;
  let moduleRef: TestingModule; // Declare moduleRef
  let testUtils: TestUtils; // Declare testUtils

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig as TypeOrmModuleOptions),
        TypeOrmModule.forFeature([
          Listing, ListingImage, User, Review, PasswordResetToken, EmailVerification,
          Category, RealEstateAttribute, VehicleAttribute,
          Report,
        ]),
      ],
      providers: [
        ListingsService,
        TestUtils,
        AuthService,
        UserService,
        JwtService,
        Mailer,
        EmailService,
        ConfigService,
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {}, // simple mock
        },
        {
          provide: getRepositoryToken(EmailVerification),
          useValue: {}, // simple mock
        },
      ],
    }).compile();

    service = moduleRef.get(ListingsService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    listingRepo = moduleRef.get(getRepositoryToken(Listing));
    imageRepo = moduleRef.get(getRepositoryToken(ListingImage));
    categoryRepo = moduleRef.get(getRepositoryToken(Category));
    testUtils = moduleRef.get<TestUtils>(TestUtils); // Get TestUtils instance

    await testUtils.reloadFixtures(); // Use TestUtils to clear database
  });

  afterAll(async () => {
    await moduleRef.close(); // Close NestJS module
  });

  beforeEach(async () => {
    await testUtils.reloadFixtures(); // Ensure clean state before each test
  });

  it('creates a listing and links images', async () => {
    const seller = await userRepo.save({ email: 'seller@t.com', name: 'Seller', role: Role.HOMEOWNER } as User);
    const img1 = await imageRepo.save({ imageUrl: 'u1.jpg', isPrimary: false } as ListingImage);
    const img2 = await imageRepo.save({ imageUrl: 'u2.jpg', isPrimary: true } as ListingImage);
    const category = await categoryRepo.save({ name: 'Real Estate', slug: 'real-estate' });
    const dto: CreateListingDto = {
      title: 'House', description: 'Nice', price: 123, currency: 'ETB',
      city: 'Addis', address: 'Somewhere', transaction_type: TransactionType.SELL, price_unit: PriceUnit.TOTAL, imageIds: [img1.id, img2.id],
      categoryId: category.id,
      propertyType: 'Apartment' // Required for RealEstateAttribute
    };
    const res = await service.create(dto, seller);
    expect(res.id).toBeDefined();
    const saved = await listingRepo.findOne({ where: { id: res.id }, relations: ['images'] });
    expect(saved?.images?.length).toBe(2);
  });

  it('updateStatus by admin persists', async () => {
    const admin = await userRepo.save({ email: 'admin@t.com', name: 'Admin', role: Role.ADMIN } as User);
    const seller = await userRepo.save({ email: 'seller2@t.com', name: 'Seller2', role: Role.HOMEOWNER } as User);
    const listing = await listingRepo.save({ title: 'Car', description: 'Good', price: 200, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as Listing);

    const res = await service.updateStatus(listing.id, { status: ListingStatus.APPROVED } as UpdateListingStatusDto, admin);
    expect(res.status).toBe(ListingStatus.APPROVED);
    const refreshed = await listingRepo.findOne({ where: { id: listing.id } });
    expect(refreshed?.status).toBe(ListingStatus.APPROVED);
  });

  it('updateMedia replaces images with provided list', async () => {
    const seller = await userRepo.save({ email: 'seller3@t.com', name: 'Seller3', role: Role.HOMEOWNER } as User);
    const listing = await listingRepo.save({ title: 'Bike', description: 'Good', price: 50, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as Listing);
    const imgA = await imageRepo.save({ imageUrl: 'a.jpg', isPrimary: false } as ListingImage);
    const imgB = await imageRepo.save({ imageUrl: 'b.jpg', isPrimary: false } as ListingImage);

    const res = await service.updateMedia(listing.id, { imageIds: [imgA.id, imgB.id] } as UpdateListingMediaDto, seller);
    expect(res.images.length).toBe(2);

    // Service returns the updated images in response; persistence may depend on owning side
    expect(res.images.map((i) => i.id).sort()).toEqual([imgA.id, imgB.id].sort());
  });
});
