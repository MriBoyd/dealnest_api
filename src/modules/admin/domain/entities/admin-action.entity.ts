import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';

export enum AdminActionType {
    APPROVE = 'approve',
    REJECT = 'reject',
}

@Entity('admin_actions')
export class AdminAction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'admin_id' })
    admin: User;

    @Column({ type: 'enum', enum: AdminActionType })
    action_type: AdminActionType;

    @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'target_id' })
    target: Listing;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at: Date;
}
