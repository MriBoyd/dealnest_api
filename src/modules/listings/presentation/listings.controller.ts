import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ListingsService } from '../application/services/listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { FilterListingsDto } from './dto/filter-listings.dto';
import { ListingResponseDto } from './dto/listing-response.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { UpdateListingMediaDto } from './dto/update-listing-media.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @Roles(Role.HOMEOWNER, Role.CORPORATE_CLIENT, Role.PROFESSIONAL_SELLER)
  async create(@Body() dto: CreateListingDto, @Request() req) {
    const result = await this.listingsService.create(dto, req.user);
    return result;
  }

  @Get()
  async findAll(@Query() filters: FilterListingsDto) {
    const result = await this.listingsService.findAll(filters);
    return result;
  }
  
  // find my listings
  @Get('/me')
  async findMyListings(@CurrentUser() user: User): Promise<ListingResponseDto[]> {
    const result = await this.listingsService.findMyListings(user);
    return result;
  }

  @Get(':id')
  async getDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListingResponseDto> {
    const result = await this.listingsService.findById(id);
    return result;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingStatusDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.listingsService.updateStatus(id, dto, user);
    return result;
  }

  @Patch(':id/media')
  @Roles(Role.HOMEOWNER, Role.CORPORATE_CLIENT, Role.PROFESSIONAL_SELLER)
  async updateMedia(
    @Param('id') id: string,
    @Body() dto: UpdateListingMediaDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.listingsService.updateMedia(id, dto, user);
    return result;
  }
}
