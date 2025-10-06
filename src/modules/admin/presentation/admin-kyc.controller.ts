// src/modules/admin/presentation/admin-kyc.controller.ts
import { Controller, Patch, Param, Body, Get, UseGuards, Query } from '@nestjs/common';
import { KycService } from 'src/modules/kyc/application/services/kyc.service';
import { KycStatus } from 'src/modules/user/domain/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { FilterKycDto } from 'src/modules/kyc/presentation/dto/filter-kyc.dto';

@Controller('admin/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminKycController {
    constructor(private readonly kycService: KycService) { }

    @Get('pending')
    async listPending(@Query() filters: FilterKycDto) {
        return this.kycService.listPending(filters);
    }

    @Get(':id')
    async getKycDetails(@Param('id') id: string) {
        return this.kycService.getKycDetails(id);
    }

    @Patch(':id')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: KycStatus; notes?: string },
    ) {
        return this.kycService.updateStatus(id, body.status, body.notes);
    }
}
