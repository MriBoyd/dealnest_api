import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../../application/services/reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report } from '../../domain/entities/report.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../domain/entities/listing.entity';
import { Repository } from 'typeorm';
import { CreateReportDto } from '../../presentation/dto/create-report.dto';
import { NotFoundException } from '@nestjs/common';

// Helper to create repository mocks
const createRepoMock = <T extends Record<string, any>>() => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepo: jest.Mocked<Repository<Report>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let listingRepo: jest.Mocked<Repository<Listing>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: createRepoMock<Report>(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createRepoMock<User>(),
        },
        {
          provide: getRepositoryToken(Listing),
          useValue: createRepoMock<Listing>(),
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepo = module.get(getRepositoryToken(Report));
    userRepo = module.get(getRepositoryToken(User));
    listingRepo = module.get(getRepositoryToken(Listing));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report successfully', async () => {
      const createReportDto: CreateReportDto = {
        reason: 'Test reason',
        reportedListingId: '1',
      };
      const reporter = { id: '1' } as User;
      const listing = { id: '1' } as Listing;

      userRepo.findOne.mockResolvedValue(reporter);
      listingRepo.findOne.mockResolvedValue(listing);
      reportRepo.create.mockReturnValue({} as Report);
      reportRepo.save.mockResolvedValue({} as Report);

      await service.create(createReportDto, reporter);

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: reporter.id } });
      expect(listingRepo.findOne).toHaveBeenCalledWith({ where: { id: String(createReportDto.reportedListingId) } });
      expect(reportRepo.create).toHaveBeenCalled();
      expect(reportRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reporter not found', async () => {
      const createReportDto: CreateReportDto = {
        reportedListingId: '1',
        reason: 'Test reason',
      };
      const reporter = { id: '1' } as User;

      userRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createReportDto, reporter)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if reported listing not found', async () => {
        const createReportDto: CreateReportDto = {
            reason: 'Test reason',
            reportedListingId: '1',
        };
        const reporter = { id: '1' } as User;

        userRepo.findOne.mockResolvedValue(reporter);
        listingRepo.findOne.mockResolvedValue(null);

        await expect(service.create(createReportDto, reporter)).rejects.toThrow(NotFoundException);
    });
  });
});
