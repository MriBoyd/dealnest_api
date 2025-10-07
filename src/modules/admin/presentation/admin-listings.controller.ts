import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminListingsService } from '../application/services/admin-listings.service';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';

@Controller('admin/listings')
@UseGuards(JwtAuthGuard)
export class AdminListingsController {
  constructor(private readonly adminListingsService: AdminListingsService) {}

  @Get()
  async listAllForReview() {
    return this.adminListingsService.listAllForReview();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateListingStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.adminListingsService.updateStatus(id, dto, user);
  }
}
