// src/modules/kyc/domain/entities/kyc.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';

// src/modules/kyc/domain/entities/kyc.entity.ts
@Entity('kyc')
export class Kyc {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.kyc, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    // Gov ID Front
    @Column({ nullable: true })
    gov_id_front_filename?: string;

    @Column({ nullable: true })
    gov_id_front_mimetype?: string;

    @Column({ type: 'bytea', nullable: true })
    gov_id_front_data?: Buffer;

    // Gov ID Back
    @Column({ nullable: true })
    gov_id_back_filename?: string;

    @Column({ nullable: true })
    gov_id_back_mimetype?: string;
    
    @Column({ type: 'bytea', nullable: true })
    gov_id_back_data?: Buffer;

    // Selfie
    @Column({ nullable: true })
    selfie_filename?: string;

    @Column({ nullable: true })
    selfie_mimetype?: string;

    @Column({ type: 'bytea', nullable: true })
    selfie_data?: Buffer;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
