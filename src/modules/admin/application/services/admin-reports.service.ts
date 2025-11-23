import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../../../listings/domain/entities/report.entity';
import { FilterReportDto } from '../../presentation/dto/filter-report.dto';
import { UpdateReportStatusDto } from '../../presentation/dto/update-report-status.dto';

@Injectable()
export class AdminReportsService {
  constructor(
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
  ) {}

  async listReports(
    filterReportDto: FilterReportDto,
  ): Promise<Report[]> {
    const { status, reporterId, listingId } = filterReportDto;
    const query = this.reportsRepo.createQueryBuilder('report');

    if (status) {
      query.andWhere('report.status = :status', { status });
    }

    if (reporterId) {
      query.andWhere('report.reporter_id = :reporterId', { reporterId });
    }

    if (listingId) {
      query.andWhere('report.listing_id = :listingId', { listingId });
    }

    return query.getMany();
  }

  async updateReportStatus(
    reportId: number,
    updateReportStatusDto: UpdateReportStatusDto,
  ): Promise<Report> {
    const report = await this.reportsRepo.findOne({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = updateReportStatusDto.status;
    return this.reportsRepo.save(report);
  }
}
