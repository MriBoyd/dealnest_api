import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';
import { ListingStatus } from '../enums/listing-status.enum';
import { ListingImage } from '../../../media/domain/entities/media.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { PriceUnit } from '../enums/price-unit.enum';
import { Category } from './category.entity';
import { RealEstateAttribute } from './real-estate.entity';
import { VehicleAttribute } from './vehicle.entity';

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

  @ManyToOne(() => User, (user) => user.listings)
  owner: User;

  @ManyToOne(() => Category, (category) => category.listings)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 255 })
  title: string; // e.g 'Apartment in Addis Ababa'

  @Column({ type: 'text' })
  description: string; // e.g 'This is a nice apartment in Addis Ababa'

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  price: number; // e.g 1000

  @Column({ length: 10, default: 'ETB' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.SELL,
  })
  transaction_type: TransactionType;

  @Column({
    type: 'enum',
    enum: PriceUnit,
    default: PriceUnit.TOTAL,
  })
  price_unit: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 255 })
  address: string; // e.g 'Addis Ababa'

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.PENDING_VERIFICATION,
  })
  status: ListingStatus;

  // cascade: true allows us to save images at the same time we save the listing
  @OneToMany(() => ListingImage, (image) => image.listing, { cascade: true })
  images: ListingImage[];

  // OPTIONAL DETAILS (OneToOne)

  @OneToOne(() => RealEstateAttribute, (realEstate) => realEstate.listing, { cascade: true, nullable: true })
  realEstateAttributes: RealEstateAttribute;

  @OneToOne(() => VehicleAttribute, (vehicle) => vehicle.listing, { cascade: true, nullable: true })
  vehicleAttributes: VehicleAttribute;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export { ListingStatus };
