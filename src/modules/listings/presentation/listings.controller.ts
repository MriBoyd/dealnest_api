import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ListingsService } from '../application/services/listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { FilterListingsDto } from './dto/filter-listings.dto';

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

}
