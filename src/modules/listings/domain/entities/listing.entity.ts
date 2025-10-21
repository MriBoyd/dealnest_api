import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';
import { Vertical } from '../enums/vertical.enum';
import { ListingStatus } from '../enums/listing-status.enum';
import { Media } from '../../../media/domain/entities/media.entity';

export enum ListingVerificationLevel {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
  CERTIFIED = 'certified',
}

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.listings, { eager: true })
  owner: User;

  @Column({ type: 'enum', enum: Vertical })
  vertical: Vertical;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  price: number;

  @Column({ length: 10, default: 'ETB' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  location?: {
    city?: string;
    subcity?: string;
    lat?: number;
    lon?: number;
  };

  @Column({ type: 'date', nullable: true })
  available_from?: Date;

  @Column('int', { nullable: true })
  square_meters?: number;

  @Column({ type: 'jsonb', nullable: true })
  amenities?: string[];

  @Column({ nullable: true })
  pet_policy?: string;

  @Column({ type: 'jsonb', nullable: true })
  nearby?: string[];

  @Column({ type: 'jsonb', nullable: true })
  extra_costs?: { name: string; amount: number }[];

  @OneToMany(() => Media, (media) => media.listing, { cascade: true })
  media: Media[];

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.PENDING_VERIFICATION,
  })
  status: ListingStatus;

  @Column({
    type: 'enum',
    enum: ListingVerificationLevel,
    default: ListingVerificationLevel.NONE,
  })
  verification_level: ListingVerificationLevel;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export { ListingStatus };
