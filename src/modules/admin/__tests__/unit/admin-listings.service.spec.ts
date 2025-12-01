import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminListingsService } from '../../application/services/admin-listings.service';
import { Listing, ListingStatus } from '../../../listings/domain/entities/listing.entity';
import { AdminAction, AdminActionType } from '../../domain/entities/admin-action.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Role } from '../../../../common/enums/role.enum';
import { UpdateListingStatusDto } from '../../presentation/dto/update-listing-status.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AdminListingsService', () => {
  let service: AdminListingsService;
  let listingsRepo: Repository<Listing>;
  let adminActionsRepo: Repository<AdminAction>;

  const mockListingsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockAdminActionsRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminListingsService,
        {
          provide: getRepositoryToken(Listing),
          useValue: mockListingsRepo,
        },
        {
          provide: getRepositoryToken(AdminAction),
          useValue: mockAdminActionsRepo,
        },
      ],
    }).compile();

    service = module.get<AdminListingsService>(AdminListingsService);
    listingsRepo = module.get<Repository<Listing>>(getRepositoryToken(Listing));
    adminActionsRepo = module.get<Repository<AdminAction>>(getRepositoryToken(AdminAction));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listAllForReview', () => {
    it('should return an array of listings', async () => {
      const result: Listing[] = [];
      mockListingsRepo.find.mockResolvedValue(result);
      expect(await service.listAllForReview()).toBe(result);
      expect(mockListingsRepo.find).toHaveBeenCalledWith({
        where: { status: ListingStatus.PENDING_VERIFICATION },
        relations: ['owner', 'category'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('updateStatus', () => {
    const listingId = '1';
    const admin = { role: Role.ADMIN } as User;
    const nonAdmin = { role: Role.INDIVIDUAL_BUYER } as User;
    const dto: UpdateListingStatusDto = {
      action_type: AdminActionType.APPROVE,
      notes: 'Looks good',
    };
    const listing = new Listing();

    it('should throw ForbiddenException if user is not an admin', async () => {
      await expect(service.updateStatus(listingId, dto, nonAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if listing not found', async () => {
        mockListingsRepo.findOne.mockResolvedValue(null);
        await expect(service.updateStatus(listingId, dto, admin)).rejects.toThrow(NotFoundException);
    });

    it('should approve a listing', async () => {
        listing.status = ListingStatus.PENDING_VERIFICATION;
        mockListingsRepo.findOne.mockResolvedValue(listing);
        mockListingsRepo.save.mockResolvedValue({ ...listing, status: ListingStatus.ACTIVE });
        mockAdminActionsRepo.create.mockReturnValue(new AdminAction());
        mockAdminActionsRepo.save.mockResolvedValue(new AdminAction());

        const result = await service.updateStatus(listingId, dto, admin);

        expect(result.status).toEqual(ListingStatus.ACTIVE);
        expect(mockListingsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: ListingStatus.ACTIVE }));
        expect(mockAdminActionsRepo.create).toHaveBeenCalledWith({
            admin,
            action_type: dto.action_type,
            target: listing,
            notes: dto.notes,
        });
        expect(mockAdminActionsRepo.save).toHaveBeenCalled();
    });

    it('should reject a listing', async () => {
        const rejectDto: UpdateListingStatusDto = { ...dto, action_type: AdminActionType.REJECT };
        listing.status = ListingStatus.PENDING_VERIFICATION;
        mockListingsRepo.findOne.mockResolvedValue(listing);
        mockListingsRepo.save.mockResolvedValue({ ...listing, status: ListingStatus.INACTIVE });

        const result = await service.updateStatus(listingId, rejectDto, admin);

        expect(result.status).toEqual(ListingStatus.INACTIVE);
        expect(mockListingsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: ListingStatus.INACTIVE }));
    });
  });
});