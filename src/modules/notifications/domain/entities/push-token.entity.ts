import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';

@Entity('push_tokens')
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  provider: 'fcm' | 'apns' | 'webpush';

  @Column()
  token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  last_seen_at: Date;
}
