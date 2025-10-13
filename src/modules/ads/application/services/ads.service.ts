import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/modules/user/domain/entities/user.entity";
import { CreateAdSlotDto } from "../../presentation/dto/create-ad-slot.dto";
import { Repository } from "typeorm";
import { AdSlot } from "../../domain/entities/ad_slot.entity";
import { Listing } from "../../../listings/domain/entities/listing.entity";

@Injectable()
export class AdsService {
    constructor(
        @InjectRepository(AdSlot) private readonly repo: Repository<AdSlot>,
    ) { }

    async createAdSlot(user: User, dto: CreateAdSlotDto): Promise<AdSlot> {
        const ad = this.repo.create({
            seller: user,
            listing: { id: dto.listing_id } as Listing,
            type: dto.type,
            start_date: dto.start_date,
            end_date: dto.end_date,
            price: dto.price,
            status: 'pending',
        });

        return this.repo.save(ad);
    }

    async listSellerAds(user: User) {
        return this.repo.find({
            where: { seller: { id: user.id } },
            relations: ['listing'],
            order: { created_at: 'DESC' },
        });
    }

    async getAllAds() {
        return this.repo.find({
            relations: ['listing', 'seller'],
            order: { created_at: 'DESC' },
        });
    }

    async updateStatus(id: string, status: string) {
        const ad = await this.repo.findOneBy({ id });
        if (!ad) throw new NotFoundException('Ad slot not found');
        ad.status = status as any;
        return this.repo.save(ad);
    }

    
}
