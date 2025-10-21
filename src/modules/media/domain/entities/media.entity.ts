import { Listing } from '../../../listings/domain/entities/listing.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @Column({ nullable: true })
  filename?: string;

  @ManyToOne(() => Listing, (listing) => listing.media, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  listing: Listing | null;

  @Column({ nullable: true })
  mimetype?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
