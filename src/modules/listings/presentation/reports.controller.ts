import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from '../application/services/reports.service';
import { CreateReportDto } from '../presentation/dto/create-report.dto';
import { Report } from '../domain/entities/report.entity';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(@Body() dto: CreateReportDto, @Request() req): Promise<Report> {
    return this.reportsService.create(dto, req.user);
  }
}
