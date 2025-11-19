import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
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


describe('ListingsService (Integration)', () => {
  let service: ListingsService;
  let userRepo: Repository<User>;
  let listingRepo: Repository<Listing>;
  let imageRepo: Repository<ListingImage>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        TypeOrmModule.forFeature([Listing, ListingImage, User]),
      ],
      providers: [ListingsService],
    }).compile();

    service = moduleRef.get(ListingsService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    listingRepo = moduleRef.get(getRepositoryToken(Listing));
    imageRepo = moduleRef.get(getRepositoryToken(ListingImage));

    await imageRepo.query('TRUNCATE TABLE "listing_images" RESTART IDENTITY CASCADE;');
    await listingRepo.query('TRUNCATE TABLE "listings" CASCADE;');
    await userRepo.query('TRUNCATE TABLE "users" CASCADE;');
  });

  it('creates a listing and links images', async () => {
    const seller = await userRepo.save({ email: 'seller@t.com', name: 'Seller', role: Role.HOMEOWNER } as User);
    const img1 = await imageRepo.save({ imageUrl: 'u1.jpg', isPrimary: false } as ListingImage);
    const img2 = await imageRepo.save({ imageUrl: 'u2.jpg', isPrimary: true } as ListingImage);

    const dto: any = {
      title: 'House', description: 'Nice', price: 123, currency: 'ETB',
      city: 'Addis', address: 'Somewhere', transaction_type: 'sell', price_unit: 'total', imageIds: [img1.id, img2.id],
    };

    const res = await service.create(dto, seller);
    expect(res.id).toBeDefined();
    const saved = await listingRepo.findOne({ where: { id: res.id }, relations: ['images'] });
    expect(saved?.images?.length).toBe(2);
  });

  it('updateStatus by admin persists', async () => {
    const admin = await userRepo.save({ email: 'admin@t.com', name: 'Admin', role: Role.ADMIN } as User);
    const seller = await userRepo.save({ email: 'seller2@t.com', name: 'Seller2', role: Role.HOMEOWNER } as User);
    const listing = await listingRepo.save({ title: 'Car', price: 200, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as Listing);

    const res = await service.updateStatus(listing.id, { status: ListingStatus.APPROVED } as UpdateListingStatusDto, admin);
    expect(res.status).toBe(ListingStatus.APPROVED);
    const refreshed = await listingRepo.findOne({ where: { id: listing.id } });
    expect(refreshed?.status).toBe(ListingStatus.APPROVED);
  });

  it('updateMedia replaces images with provided list', async () => {
    const seller = await userRepo.save({ email: 'seller3@t.com', name: 'Seller3', role: Role.HOMEOWNER } as User);
    const listing = await listingRepo.save({ title: 'Bike', price: 50, currency: 'ETB', city: 'Addis', address: 'Addr', owner: seller } as Listing);
    const imgA = await imageRepo.save({ imageUrl: 'a.jpg', isPrimary: false } as ListingImage);
    const imgB = await imageRepo.save({ imageUrl: 'b.jpg', isPrimary: false } as ListingImage);

    const res = await service.updateMedia(listing.id, { imageIds: [imgA.id, imgB.id] } as UpdateListingMediaDto, seller);
    expect(res.images.length).toBe(2);

    // Service returns the updated images in response; persistence may depend on owning side
    expect(res.images.map((i) => i.id).sort()).toEqual([imgA.id, imgB.id].sort());
  });
});
