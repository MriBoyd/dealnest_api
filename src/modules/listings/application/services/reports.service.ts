import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from '../../domain/entities/report.entity';
import { CreateReportDto } from '../../presentation/dto/create-report.dto';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../domain/entities/listing.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
  ) {}

  async create(dto: CreateReportDto, reporter: User): Promise<Report> {
    const user = await this.userRepo.findOne({ where: { id: reporter.id } });
    if (!user) throw new NotFoundException('Reporter not found');

    let reportedListing: Listing | undefined;
    if (dto.reportedListingId) {
      const found = await this.listingRepo.findOne({ where: { id: dto.reportedListingId } });
      if (!found) throw new NotFoundException('Reported listing not found');
      reportedListing = found;
    }

    const report = this.reportRepo.create({
      reporter: user,
      reportedListing,
      reason: dto.reason,
      status: ReportStatus.PENDING,
    });
    return this.reportRepo.save(report);
  }
}
