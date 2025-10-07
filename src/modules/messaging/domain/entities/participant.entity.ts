import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { MessageThread } from './message-thread.entity';
import { User } from '../../../user/domain/entities/user.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MessageThread, (t) => t.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'thread_id' })
  thread: MessageThread;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // optional per-participant last read message id
  @Column({ type: 'uuid', nullable: true })
  last_read_message_id?: string | null;

  @CreateDateColumn()
  joined_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
