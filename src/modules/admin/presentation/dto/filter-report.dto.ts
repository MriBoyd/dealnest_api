import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '../../../listings/domain/entities/report.entity';

export class FilterReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  reporterId?: number;

  @IsOptional()
  listingId?: number;
}
