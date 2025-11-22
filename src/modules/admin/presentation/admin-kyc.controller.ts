// src/modules/admin/presentation/admin-kyc.controller.ts
import {
  Controller,
  Patch,
  Param,
  Body,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminKycService } from '../application/services/admin-kyc.service';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { FilterKycDto } from 'src/modules/kyc/presentation/dto/filter-kyc.dto';
import { KycStatus } from 'src/modules/user/domain/enums/kyc-status.enum';

@Controller('admin/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminKycController {
  constructor(private readonly adminKycService: AdminKycService) {}

  @Get('pending')
  async listPending(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.adminKycService.listPending(Number(page), Number(limit));
  }

  @Get(':id')
  async getKycDetails(@Param('id') id: string) {
    return this.adminKycService.getKycDetails(id);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: KycStatus; notes?: string },
  ) {
    return this.adminKycService.updateStatus(id, body.status, body.notes);
  }
}
