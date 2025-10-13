import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/modules/auth/infrastructure/guards/jwt-auth.guard";
import { AdsService } from "../application/services/ads.service";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/modules/user/domain/entities/user.entity";
import { CreateAdSlotDto } from "./dto/create-ad-slot.dto";

@Controller('ads/slots')
@UseGuards(JwtAuthGuard)
export class AdsController {
    constructor(private readonly adService: AdsService) { }

    @Post()
    createAdSlot(@CurrentUser() user: User, @Body() dto: CreateAdSlotDto) {
        return this.adService.createAdSlot(user, dto);
    }

    @Get()
    listSellerAds(@CurrentUser() user: User) {
        return this.adService.listSellerAds(user);
    }
}
