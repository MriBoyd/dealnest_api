import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MessageThread } from '../../domain/entities/message-thread.entity';
import { Participant } from '../../domain/entities/participant.entity';
import { Message } from '../../domain/entities/message.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { UserMapper } from 'src/modules/user/application/mappers/user.mapper';
import { MessageMapper, MessageResponseDto } from '../mappers/message.mapper';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessagingService {
    constructor(
        @InjectRepository(MessageThread) private threadRepo: Repository<MessageThread>,
        @InjectRepository(Participant) private participantRepo: Repository<Participant>,
        @InjectRepository(Message) private messageRepo: Repository<Message>,
        @InjectRepository(User) private userRepo: Repository<User>,
        private readonly notificationsService: NotificationsService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async createThread(creatorId: string, dto: { type: string; listing_id?: string; booking_id?: string; participantIds: string[] }) {
        // ensure participants exist
        const users = await this.userRepo.findBy({ id: In(dto.participantIds) });
        if (users.length !== dto.participantIds.length) throw new NotFoundException('Some participants not found');

        const thread = this.threadRepo.create({
            type: dto.type as 'direct' | 'listing' | 'booking' | 'group',
            listing_id: dto.listing_id ?? null,
            booking_id: dto.booking_id ?? null,
        });
        const saved = await this.threadRepo.save(thread);

        const participants = dto.participantIds.map((uid) =>
            this.participantRepo.create({ thread: saved, user: { id: uid } as User }),
        );
        await this.participantRepo.save(participants);

        // return thread with participants
        const newThread = await this.threadRepo.findOneOrFail({ where: { id: saved.id }, relations: ['participants', 'participants.user'] });

        return {
            ...newThread,
            participants: newThread.participants.map(p => ({
                ...p,
                user: UserMapper.toResponse(p.user)
            })),
        };
    }

    async getThreadIdsForUser(userId: string) {
        const parts = await this.participantRepo.find({ where: { user: { id: userId } }, relations: ['thread'] });
        return parts.map((p) => p.thread.id);
    }

    async sendMessage(senderId: string, threadId: string, text?: string, mediaId?: string) {
        const thread = await this.threadRepo.findOne({ where: { id: threadId }, relations: ['participants', 'participants.user'] });
        if (!thread) throw new NotFoundException('Thread not found');

        // ensure sender is a participant
        const isParticipant = thread.participants.some(p => p.user.id === senderId);
        if (!isParticipant) throw new ForbiddenException('Not a participant');

        const sender = await this.userRepo.findOne({ where: { id: senderId } });
        if (!sender) throw new NotFoundException('Sender not found');

        const message = this.messageRepo.create({
            thread: thread,
            sender: sender,
            text: text ?? null,
            media_id: mediaId ?? null,
            type: mediaId ? 'image' : 'text',
        });

        const saved = await this.messageRepo.save(message);

        // notify other participants
        const recipientIds = thread.participants.map((p) => p.user.id).filter((id) => id !== senderId);
        for (const uid of recipientIds) {
            await this.notificationsService.create({
                userId: uid,
                type: 'message',
                payload: { threadId: thread.id, messageId: saved.id, preview: (saved.text || '').slice(0, 100) }, // Use saved.id for messageId
            });
        }

        const response = MessageMapper.toResponse(saved);

        this.eventEmitter.emit('message.sent', { threadId, response, senderId });

        return MessageMapper.toResponse(saved);
    }

    async listMessages(threadId: string, page = 1, limit = 50): Promise<{ items: MessageResponseDto[], total: number, page: number, limit: number }> {
        const skip = (page - 1) * limit;
        const [items, total] = await this.messageRepo.findAndCount({
            where: { thread: { id: threadId } as MessageThread },
            relations: ['sender'],
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });

        const mappedItems = items.reverse().map(item => {
            item.thread = { id: threadId } as MessageThread;
            return MessageMapper.toResponse(item);
        });

        return { items: mappedItems, total, page, limit }; // return ascending
    }

    async listThreadsForUser(userId: string) {
        const threads = await this.threadRepo.createQueryBuilder('thread')
            .innerJoin('thread.participants', 'participant', 'participant.user_id = :userId', { userId })
            .leftJoinAndSelect('thread.participants', 'participants')
            .leftJoinAndSelect('participants.user', 'user')
            .leftJoinAndMapOne(
                'thread.last_message',
                Message,
                'message',
                'message.id = (SELECT id FROM messages WHERE messages."threadId" = thread.id ORDER BY created_at DESC LIMIT 1)'
            )
            .leftJoinAndSelect('message.sender', 'sender')
            .orderBy('message.created_at', 'DESC')
            .getMany();

        return threads.map(thread => {
            const newThread = {
                ...thread,
                participants: thread.participants.map(p => ({
                    ...p,
                    user: UserMapper.toResponse(p.user)
                }))
            };

            if ((thread as any).last_message) {
                const lastMessage = (thread as any).last_message;
                lastMessage.thread = thread;
                (newThread as any).messages = [MessageMapper.toResponse(lastMessage)];
                delete (newThread as any).last_message;
            } else {
                (newThread as any).messages = [];
            }
            return newThread;
        });
    }
}
