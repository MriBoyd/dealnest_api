import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Listing } from '../../domain/entities/listing.entity';
import { Category } from '../../domain/entities/category.entity';
import { RealEstateAttribute } from '../../domain/entities/real-estate.entity';
import { VehicleAttribute } from '../../domain/entities/vehicle.entity';
import { CreateListingDto } from '../../presentation/dto/create-listing.dto';
import { User } from '../../../user/domain/entities/user.entity';
import { ListingMapper } from '../mappers/listing.mapper';
import { ListingResponseDto } from '../../presentation/dto/listing-response.dto';
import { FilterListingsDto } from '../../presentation/dto/filter-listings.dto';
import { UpdateListingStatusDto } from '../../presentation/dto/update-listing-status.dto';
import { UpdateListingMediaDto } from '../../presentation/dto/update-listing-media.dto';
import { ListingImage } from '../../../media/domain/entities/media.entity';

@Injectable()
export class ListingsService {
	private postGisInstalled: boolean | null = null;

	constructor(
		@InjectRepository(Listing)
		private readonly listingsRepository: Repository<Listing>,
		@InjectRepository(ListingImage)
		private readonly imagesRepository: Repository<ListingImage>,
		@InjectRepository(Category)
		private readonly categoryRepository: Repository<Category>,
		@InjectRepository(RealEstateAttribute)
		private readonly realEstateRepository: Repository<RealEstateAttribute>,
		@InjectRepository(VehicleAttribute)
		private readonly vehicleRepository: Repository<VehicleAttribute>,
		@InjectDataSource()
		private readonly dataSource: DataSource,
	) { }

	private async isPostGisInstalled(): Promise<boolean> {
		if (this.postGisInstalled === null) {
			const result = await this.dataSource.query(
				`SELECT 1 FROM pg_extension WHERE extname = 'postgis'`,
			);
			this.postGisInstalled = result.length > 0;
		}
		return this.postGisInstalled;
	}

	async create(
		dto: CreateListingDto,
		owner: User,
	): Promise<ListingResponseDto> {
		// Find category
		const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
		if (!category) {
			throw new BadRequestException('Invalid category');
		}

		const listing = this.listingsRepository.create({
			owner,
			title: dto.title,
			description: dto.description,
			price: dto.price,
			currency: dto.currency ?? 'ETB',
			city: dto.city,
			address: dto.address,
			transaction_type: dto.transaction_type,
			price_unit: dto.price_unit,
			category,
		});

		// Attach real estate or vehicle attributes if category matches
		let realEstate: RealEstateAttribute | undefined;
		let vehicle: VehicleAttribute | undefined;
		if (category.name.toLowerCase().includes('real estate')) {
			realEstate = this.realEstateRepository.create({
				propertyType: dto.propertyType,
				areaSqm: dto.areaSqm,
				bedrooms: dto.bedrooms,
				bathrooms: dto.bathrooms,
				floorLevel: dto.floorLevel,
				furnished: dto.furnished,
			});
			listing.realEstateAttributes = realEstate;
		} else if (category.name.toLowerCase().includes('vehicle')) {
			vehicle = this.vehicleRepository.create({
				make: dto.make,
				model: dto.model,
				year: dto.year,
				mileageKm: dto.mileageKm,
				transmission: dto.transmission,
				fuelType: dto.fuelType,
				color: dto.color,
				condition: dto.condition,
			});
			listing.vehicleAttributes = vehicle;
		}

		const saved = await this.listingsRepository.save(listing);

		if (dto.imageIds && dto.imageIds.length) {
			const images = await this.imagesRepository.find({
				where: { id: In(dto.imageIds) },
				relations: ['listing'],
			});
			if (!images.length) {
				throw new BadRequestException('No images found for provided ids');
			}
			if (images.some((img) => img.listing)) {
				throw new BadRequestException('Some images already linked to another listing');
			}
			for (const img of images) {
				img.listing = saved;
			}
			await this.imagesRepository.save(images);
		}

		const updatedListing = await this.listingsRepository.findOne({
			where: { id: saved.id },
			relations: ['images', 'owner', 'category', 'realEstateAttributes', 'vehicleAttributes'],
		});

		if (!updatedListing) {
			throw new NotFoundException(
				`Listing with id ${saved.id} not found after creation.`,
			);
		}

		return ListingMapper.toResponse(updatedListing);
	}

	async findAll(filters: FilterListingsDto) {
		const qb = this.listingsRepository
			.createQueryBuilder('listing')
			.leftJoinAndSelect('listing.owner', 'owner')
			.leftJoinAndSelect('listing.images', 'images')
			.leftJoinAndSelect('listing.category', 'category');

		if (filters.city) {
			qb.andWhere('listing.city ILIKE :city', { city: `%${filters.city}%` });
		}
		if (filters.categoryId) {
			qb.andWhere('listing.categoryId = :categoryId', { categoryId: filters.categoryId });
		}

		if (filters.transaction_type) {
			qb.andWhere('listing.transaction_type = :transaction_type', { transaction_type: filters.transaction_type });
		}
		if (filters.price_unit) {
			qb.andWhere('listing.price_unit = :price_unit', { price_unit: filters.price_unit });
		}

		if (filters.minPrice) {
			qb.andWhere('listing.price >= :minPrice', { minPrice: filters.minPrice });
		}
		if (filters.maxPrice) {
			qb.andWhere('listing.price <= :maxPrice', { maxPrice: filters.maxPrice });
		}

		if (filters.q) {
			qb.andWhere('(listing.title ILIKE :q OR listing.description ILIKE :q)', {
				q: `%${filters.q}%`,
			});
		}

		const page = filters.page || 1;
		const limit = filters.limit || 10;
		const skip = (page - 1) * limit;

		const sortBy = filters.sortBy || 'created_at';
		const order = filters.order || 'DESC';

		qb.orderBy(`listing.${sortBy}`, order).skip(skip).take(limit);

		const [items, total] = await qb.getManyAndCount();

		return {
			data: items.map((item) => ListingMapper.toResponse(item)),
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				sortBy,
				order,
			},
		};
	}

	async findById(id: string): Promise<ListingResponseDto> {
		const listing = await this.listingsRepository.findOne({
			where: { id },
			relations: ['images', 'owner', 'category', 'realEstateAttributes', 'vehicleAttributes'],
		});

		if (!listing) {
			throw new NotFoundException(`Listing with id ${id} not found`);
		}

		return ListingMapper.toResponse(listing);
	}

	async updateStatus(
		id: string,
		dto: UpdateListingStatusDto,
		adminUser: User,
	): Promise<ListingResponseDto> {
		if (adminUser.role !== 'admin') {
			throw new ForbiddenException('Only admins can update listing status');
		}

		const listing = await this.listingsRepository.findOne({
			where: { id },
			relations: ['owner'],
		});

		if (!listing) {
			throw new NotFoundException(`Listing with id ${id} not found`);
		}

		listing.status = dto.status;
		listing.updated_at = new Date();

		const saved = await this.listingsRepository.save(listing);
		return ListingMapper.toResponse(saved);
	}

	async updateMedia(
		listingId: string,
		dto: UpdateListingMediaDto,
		user: User,
	): Promise<ListingResponseDto> {
		const listing = await this.listingsRepository.findOne({
			where: { id: listingId },
			relations: ['owner', 'images'],
		});

		if (!listing) throw new NotFoundException('Listing not found');

		if (listing.owner.id !== user.id && user.role !== 'admin') {
			throw new ForbiddenException(
				'Not authorized to update media for this listing',
			);
		}

		if (dto.imageIds && dto.imageIds.length > 0) {
			const newImages = await this.imagesRepository.find({
				where: { id: In(dto.imageIds) },
				relations: ['listing'],
			});
			if (newImages.length !== dto.imageIds.length) {
				throw new BadRequestException('Some image IDs were not found.');
			}
			const alreadyAssigned = newImages.find(
				(img) => img.listing && img.listing.id !== listing.id,
			);
			if (alreadyAssigned) {
				throw new BadRequestException(
					`Image ID ${alreadyAssigned.id} is already assigned to another listing.`,
				);
			}
			listing.images = newImages;
		} else {
			listing.images = [];
		}

		const savedListing = await this.listingsRepository.save(listing);
		return ListingMapper.toResponse(savedListing);
	}

	// find my listings
	async findMyListings(user: User): Promise<ListingResponseDto[]> {
		const listings = await this.listingsRepository.find({
			where: { owner: { id: user.id } },
			relations: ['images'],
		});
		return listings.map((listing) => ListingMapper.toResponse(listing));
	}
}
