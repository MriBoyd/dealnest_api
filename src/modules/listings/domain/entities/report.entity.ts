import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Listing } from '../entities/listing.entity';
import { User } from '../../../user/domain/entities/user.entity';

export enum ReportStatus {
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  reporter: User;

  @ManyToOne(() => Listing, { nullable: true })
  reportedListing: Listing;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @CreateDateColumn()
  created_at: Date;
}
