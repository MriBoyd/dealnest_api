import { Exclude, Expose } from 'class-transformer';
import { Role } from 'src/common/enums/role.enum';
import { Kyc } from 'src/modules/kyc/domain/entities/kyc.entity';
import { Listing } from 'src/modules/listings/domain/entities/listing.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

export enum KycStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO: Store profile picture in a dedicated file storage service like S3 instead of the database.
  @Column({ type: 'bytea', nullable: true })
  profile_pic_data?: Buffer;

  @Column({ nullable: true })
  profile_pic_mimetype?: string;

  @Column({ unique: true })
  @Expose()
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  @Expose()
  phone_number: string | null;

  @Column({ nullable: true })
  @Expose()
  agent_code?: string;

  @Column({ nullable: true })
  @Exclude()
  password_hash?: string;

  @Column()
  @Expose()
  name: string;

  @Column({
    type: 'enum',
    enum: Role,
  })
  @Expose()
  role: Role;

  @Column({ default: 'am' })
  @Expose()
  preferred_language: string;

  @Column({ type: 'boolean', default: false })
  @Expose()
  is_email_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  email_verification_token: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  @Exclude()
  email_verification_expires: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  @Exclude()
  last_verification_email_sent: Date | null;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.NOT_SUBMITTED,
  })
  @Expose()
  kyc_status: KycStatus;

  @Column({ type: 'text', nullable: true })
  kyc_notes?: string | null;

  @OneToOne(() => Kyc, (kyc) => kyc.user)
  kyc: Kyc;

  @OneToMany(() => Listing, (listing) => listing.owner)
  listings: Listing[];

  @CreateDateColumn()
  @Expose()
  created_at: Date;

  @UpdateDateColumn()
  @Expose()
  updated_at: Date;
}
