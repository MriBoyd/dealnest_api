import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminReportsService } from '../../application/services/admin-reports.service';
import { Report, ReportStatus } from '../../../listings/domain/entities/report.entity';
import { FilterReportDto } from '../../presentation/dto/filter-report.dto';
import { UpdateReportStatusDto } from '../../presentation/dto/update-report-status.dto';
import { NotFoundException } from '@nestjs/common';


describe('AdminReportsService', () => {
    let service: AdminReportsService;
    let reportsRepo: Repository<Report>;

    // Use a single queryBuilder mock instance for all calls
    const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
    };
    const mockReportsRepo = {
        createQueryBuilder: jest.fn(() => queryBuilder),
        findOne: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminReportsService,
                {
                    provide: getRepositoryToken(Report),
                    useValue: mockReportsRepo,
                },
            ],
        }).compile();

        service = module.get<AdminReportsService>(AdminReportsService);
        reportsRepo = module.get<Repository<Report>>(getRepositoryToken(Report));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('listReports', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should list reports with filters', async () => {
            const filterDto: FilterReportDto = { status: ReportStatus.PENDING };
            (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

            await service.listReports(filterDto);
            
            expect(queryBuilder.andWhere).toHaveBeenCalledWith('report.status = :status', { status: filterDto.status });
            expect(queryBuilder.getMany).toHaveBeenCalled();
        });
    });

    describe('updateReportStatus', () => {
        const reportId = 1;
        const dto: UpdateReportStatusDto = { status: ReportStatus.APPROVED };
        const report = new Report();

        it('should throw NotFoundException if report not found', async () => {
            mockReportsRepo.findOne.mockResolvedValue(null);
            await expect(service.updateReportStatus(reportId, dto)).rejects.toThrow(NotFoundException);
        });

        it('should update a report status', async () => {
            report.status = ReportStatus.PENDING;
            mockReportsRepo.findOne.mockResolvedValue(report);
            mockReportsRepo.save.mockResolvedValue({ ...report, status: dto.status });

            const result = await service.updateReportStatus(reportId, dto);
            
            expect(result.status).toEqual(dto.status);
            expect(mockReportsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: dto.status }));
        });
    });
});