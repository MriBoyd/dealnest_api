import { Test } from '@nestjs/testing';
import { ListingsService } from '../../../listings/application/services/listings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import { ListingImage } from '../../../media/domain/entities/media.entity';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '../../../../common/enums/role.enum';
import { UpdateListingStatusDto } from '../../../listings/presentation/dto/update-listing-status.dto';
import { ListingStatus } from '../../../listings/domain/enums/listing-status.enum';
import { UpdateListingMediaDto } from '../../../listings/presentation/dto/update-listing-media.dto';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { TransactionType } from '../../domain/enums/transaction-type.enum';
import { PriceUnit } from '../../domain/enums/price-unit.enum';
import { Category } from '../../../listings/domain/entities/category.entity';
import { RealEstateAttribute } from '../../../listings/domain/entities/real-estate.entity';
import { VehicleAttribute } from '../../../listings/domain/entities/vehicle.entity';


describe('ListingsService (Unit)', () => {
	let service: ListingsService;
	let listingRepo: jest.Mocked<Repository<Listing>>;
	let imageRepo: jest.Mocked<Repository<ListingImage>>;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				ListingsService,
				{ provide: getRepositoryToken(Listing), useValue: createRepoMock<Listing>() },
				{ provide: getRepositoryToken(ListingImage), useValue: createRepoMock<ListingImage>() },
				{ provide: getRepositoryToken(Category), useValue: createRepoMock<Category>() },
				{ provide: getRepositoryToken(RealEstateAttribute), useValue: createRepoMock<RealEstateAttribute>() },
				{ provide: getRepositoryToken(VehicleAttribute), useValue: createRepoMock<VehicleAttribute>() },
				{ provide: (require('typeorm').DataSource), useValue: { query: jest.fn().mockResolvedValue([]) } },
			],
		}).compile();

		service = moduleRef.get(ListingsService);
		listingRepo = moduleRef.get(getRepositoryToken(Listing));
		imageRepo = moduleRef.get(getRepositoryToken(ListingImage));
	});

	it('updateStatus throws for non-admin', async () => {
		const dto: UpdateListingStatusDto = { status: ListingStatus.APPROVED };
		await expect(
			service.updateStatus('id-1', dto, { id: 'u1', role: Role.INDIVIDUAL_BUYER } as User),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('updateStatus throws when listing not found', async () => {
		listingRepo.findOne.mockResolvedValue(null);
		const dto: UpdateListingStatusDto = { status: ListingStatus.APPROVED };
		await expect(
			service.updateStatus('id-1', dto, { id: 'admin', role: Role.ADMIN } as User),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it('updateStatus updates and returns mapped response', async () => {
		const existing: Partial<Listing> = { id: 'l1', status: ListingStatus.PENDING_VERIFICATION };
		listingRepo.findOne.mockResolvedValue(existing as Listing);
		listingRepo.save.mockImplementation(async (l: any) => ({ ...existing, ...l, owner: { id: 'o1', email: 'o@test.com', name: 'Owner', role: Role.HOMEOWNER } } as Listing));

		const dto: UpdateListingStatusDto = { status: ListingStatus.APPROVED };
		const result = await service.updateStatus('l1', dto, { id: 'admin', role: Role.ADMIN } as User);

		expect(result.status).toBe(ListingStatus.APPROVED);
		expect(listingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1', status: ListingStatus.APPROVED }));
	});

	it('updateMedia forbids non-owner non-admin', async () => {
		listingRepo.findOne.mockResolvedValue({ id: 'l1', owner: { id: 'owner1' } as User, images: [] as ListingImage[] } as Listing);
		const dto: UpdateListingMediaDto = { imageIds: [1, 2] };
		await expect(
			service.updateMedia('l1', dto, { id: 'user2', role: Role.INDIVIDUAL_BUYER } as User),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('updateMedia throws if images assigned to another listing', async () => {
		listingRepo.findOne.mockResolvedValue({ id: 'l1', owner: { id: 'owner1' } as User, images: [] as ListingImage[] } as Listing);
		imageRepo.find.mockResolvedValue([
			{ id: 10, listing: { id: 'l2' } } as ListingImage,
		]);

		const dto: UpdateListingMediaDto = { imageIds: [10] };
		await expect(
			service.updateMedia('l1', dto, { id: 'owner1', role: Role.HOMEOWNER } as User),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('create throws when provided imageIds not found', async () => {
		imageRepo.find.mockResolvedValue([] as ListingImage[]);
		listingRepo.save.mockResolvedValue({ id: 'l1' } as Listing);
		listingRepo.findOne.mockResolvedValue({ id: 'l1', owner: { id: 'o1', email: 'o@test.com', name: 'Owner', role: Role.HOMEOWNER } as User, images: [] as ListingImage[] } as Listing);

		await expect(
			service.create({ title: 'T', description: 'D', price: 10, transaction_type: 'sell' as TransactionType, price_unit: 'total' as PriceUnit, city: 'Addis', address: 'Addr', imageIds: [1], categoryId: 'c1' }, { id: 'o1' } as User),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('check listing exist', async () => {

		listingRepo.save.mockResolvedValue({ id: 'l1' } as Listing);



	});


});

function createRepoMock<T>() {
	return {
		create: jest.fn((x) => x),
		save: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		createQueryBuilder: jest.fn(),
		delete: jest.fn(),
		query: jest.fn(),
	} as unknown as jest.Mocked<Repository<any>>;
}
