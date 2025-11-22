// src/modules/kyc/domain/entities/kyc.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';
import { Expose } from 'class-transformer';
import { KycStatus } from '../../../user/domain/enums/kyc-status.enum';

// src/modules/kyc/domain/entities/kyc.entity.ts
@Entity('kyc')
export class Kyc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.kyc, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  // Gov ID Front
  @Column()
  gov_id_front_filename: string;

  @Column()
  gov_id_front_mimetype: string;

  @Column({ type: 'bytea', })
  gov_id_front_data: Buffer;

  // Gov ID Back
  @Column()
  gov_id_back_filename: string;

  @Column()
  gov_id_back_mimetype: string;

  @Column({ type: 'bytea', })
  gov_id_back_data: Buffer;

  // Selfie
  @Column()
  selfie_filename: string;

  @Column()
  selfie_mimetype: string;

  @Column({ type: 'bytea' })
  selfie_data: Buffer;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  kyc_status: KycStatus;

  @Column({ type: 'text', nullable: true })
  kyc_notes?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
