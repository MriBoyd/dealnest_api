import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Participant } from './participant.entity';
import { Message } from './message.entity';

export type ThreadType = 'direct' | 'listing' | 'booking' | 'group';

@Entity('threads')
export class MessageThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, default: 'direct' })
  type: ThreadType;

  @Column({ type: 'uuid', nullable: true })
  listing_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  booking_id?: string | null;

  @OneToMany(() => Participant, (p) => p.thread, { cascade: true })
  participants: Participant[];

  @OneToMany(() => Message, (m) => m.thread, { cascade: true })
  messages: Message[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
