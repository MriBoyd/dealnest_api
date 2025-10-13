import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdSlot } from './domain/entities/ad_slot.entity';
import { AdsService } from './application/services/ads.service';
import { AdsController } from './presentation/ads.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AdSlot])],
    providers: [AdsService],
    exports: [AdsService],
    controllers: [AdsController],
})
export class AdsModule { }
