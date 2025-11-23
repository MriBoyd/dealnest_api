import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { AdminReportsService } from '../application/services/admin-reports.service';
import { FilterReportDto } from './dto/filter-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  async listReports(@Query() filterReportDto: FilterReportDto) {
    return this.adminReportsService.listReports(filterReportDto);
  }

  @Patch(':id/status')
  async updateReportStatus(
    @Param('id') id: number,
    @Body() updateReportStatusDto: UpdateReportStatusDto,
  ) {
    return this.adminReportsService.updateReportStatus(
      id,
      updateReportStatusDto,
    );
  }
}
