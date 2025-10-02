import { Controller, Post, Body, UseGuards, Request, Get, Query, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ListingsService } from '../application/services/listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { FilterListingsDto } from './dto/filter-listings.dto';
import { ListingResponseDto } from './dto/listing-response.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { UpdateListingMediaDto } from './dto/update-listing-media.dto';

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(@Body() dto: CreateListingDto, @Request() req) {
        return this.listingsService.create(dto, req.user);
    }

    @Get()
    async findAll(@Query() filters: FilterListingsDto) {
        return this.listingsService.findAll(filters);
    }

    @Get(':id')
    async getDetail(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<ListingResponseDto> {
        return this.listingsService.findById(id);
    }


    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateListingStatusDto,
        @CurrentUser() user: User, // your custom decorator
    ) {
        return this.listingsService.updateStatus(id, dto, user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/media')
    async updateMedia(
        @Param('id') id: string,
        @Body() dto: UpdateListingMediaDto,
        @CurrentUser() user: User,
    ) {
        return this.listingsService.updateMedia(id, dto, user);
    }



}
