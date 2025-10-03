import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingStatus } from '../../../listings/domain/entities/listing.entity';
import { AdminAction, AdminActionType } from '../../domain/entities/admin-action.entity';
import { UpdateListingStatusDto } from '../../presentation/dto/update-listing-status.dto';
import { User } from '../../../user/domain/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class AdminListingsService {
    constructor(
        @InjectRepository(Listing) private listingsRepo: Repository<Listing>,
        @InjectRepository(AdminAction) private adminActionsRepo: Repository<AdminAction>,
    ) { }

    async listAllForReview(): Promise<Listing[]> {
        return this.listingsRepo.find({
            where: { status: ListingStatus.PENDING_VERIFICATION },
            relations: ['owner', 'media'],
            order: { created_at: 'DESC' },
        });
    }

    async updateStatus(listingId: string, dto: UpdateListingStatusDto, admin: User) {
        if (admin.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can perform this action');
        }

        const listing = await this.listingsRepo.findOne({ where: { id: listingId } });
        if (!listing) throw new NotFoundException('Listing not found');

        // Change status based on action
        if (dto.action_type === AdminActionType.APPROVE) {
            listing.status = ListingStatus.ACTIVE;
        } else {
            listing.status = ListingStatus.INACTIVE;
        }
        await this.listingsRepo.save(listing);

        // Save audit record
        const action = this.adminActionsRepo.create({
            admin,
            action_type: dto.action_type,
            target: listing,
            notes: dto.notes,
        });
        await this.adminActionsRepo.save(action);

        return listing;
    }
}
