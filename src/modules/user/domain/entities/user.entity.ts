import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../../../common/enums/role.enum';
import { Kyc } from '../../../kyc/domain/entities/kyc.entity';
import { EmailVerification } from '../../../email/domain/entities/email-verification.entity';
import { Listing } from '../../../listings/domain/entities/listing.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  // the user have kyc or not
  @Column({ type: 'boolean', default: false, nullable: false})
  has_kyc: boolean;

  @OneToOne(() => Kyc, (kyc) => kyc.user)
  kyc: Kyc;

  @OneToOne(() => EmailVerification, (verification) => verification.user)
  email_verification: EmailVerification;

  @OneToMany(() => Listing, (listing) => listing.owner)
  listings: Listing[];

  @CreateDateColumn()
  @Expose()
  created_at: Date;

  @UpdateDateColumn()
  @Expose()
  updated_at: Date;
}
