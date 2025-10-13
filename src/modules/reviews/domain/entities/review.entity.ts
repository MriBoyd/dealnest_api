import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';

export enum ReviewTargetType {
    LISTING = 'listing',
    SELLER = 'seller',
}

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    reviewer: User; // The person giving the review

    @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
    seller?: User; // The seller being reviewed (if target_type = seller)

    @ManyToOne(() => Listing, { eager: true, onDelete: 'SET NULL', nullable: true })
    listing?: Listing; // The listing being reviewed (if target_type = listing)

    @Column({ type: 'enum', enum: ReviewTargetType })
    target_type: ReviewTargetType;

    @Column({ type: 'int', width: 1 })
    rating: number; // 1-5 stars

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Column({ default: false })
    is_approved: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}