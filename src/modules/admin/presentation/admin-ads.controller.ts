import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { AdsService } from 'src/modules/ads/application/services/ads.service';

@Controller('admin/ads/slots')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
export class AdminAdsController {
    constructor(private readonly adService: AdsService) { }

    @Get()
    async listAll() {
        return this.adService.getAllAds();
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired',
    ) {
        return this.adService.updateStatus(id, status);
    }

    // The updateStatus method can be used to activate an ad by setting its status to 'active'.
    // The 'activate' endpoint is redundant.
    // If specific logic is needed for activation, it should be in the service.
}
