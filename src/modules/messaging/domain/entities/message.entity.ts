import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { MessageThread } from './message-thread.entity';
import { User } from '../../../user/domain/entities/user.entity';

export type MessageType = 'text' | 'image' | 'video' | 'system';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MessageThread, (thread) => thread.messages, {
    onDelete: 'CASCADE',
  })
  thread: MessageThread;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  sender: User;

  @Column({ type: 'text', nullable: true })
  text?: string | null;

  @Column({ type: 'uuid', nullable: true })
  media_id?: string | null; // reference to media table

  @Column({ type: 'varchar', length: 20, default: 'text' })
  type: MessageType;

  @CreateDateColumn()
  created_at: Date;
}
