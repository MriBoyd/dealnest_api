import { User } from 'src/modules/user/domain/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Listing } from '../../../listings/domain/entities/listing.entity';

@Entity('ad_slots')
export class AdSlot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    seller: User;

    @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
    listing: Listing;

    @Column({ type: 'varchar', length: 20 })
    type: 'banner' | 'featured'; // banner = site-wide, featured = boosted listing

    @Column({ type: 'timestamp' })
    start_date: Date;

    @Column({ type: 'timestamp' })
    end_date: Date;

    @Column({ type: 'numeric', precision: 10, scale: 2 })
    price: number;

    @Column({ default: 'pending' })
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';

    @Column({ nullable: true })
    payment_reference?: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
