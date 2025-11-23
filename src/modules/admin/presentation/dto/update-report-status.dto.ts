import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../../listings/domain/entities/report.entity';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
