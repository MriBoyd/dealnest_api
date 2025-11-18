import { Controller, Get, Query } from '@nestjs/common';
import { ListingsService } from '../../listings/application/services/listings.service';
import { FilterListingsDto } from '../../listings/presentation/dto/filter-listings.dto';

@Controller('agent')
export class AgentController {
    constructor(private readonly listingsService: ListingsService) {}

    @Get('/listings')
    async findAll(@Query() filters: FilterListingsDto) {
        return this.listingsService.findAll(filters);
    } 
}
