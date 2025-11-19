import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../domain/entities/notification.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Server } from 'socket.io';

@Injectable()
export class NotificationsService {
  // Optionally supply Socket.IO server to emit realtime notifications
  public ioServer?: Server;

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  setIoServer(io: Server) {
    this.ioServer = io;
  }

  async create(opts: { userId: string; type: string; payload: any }) {
    const user = await this.userRepo.findOne({ where: { id: opts.userId } });
    if (!user) return null;

    const notification = this.notificationRepo.create({
      user,
      type: opts.type,
      payload: opts.payload,
      is_read: false,
    });

    const saved = await this.notificationRepo.save(notification);

    // Emit via socket if connected (clients should listen to `notification` event)
    try {
      if (this.ioServer) {
        this.ioServer.to(`user_${opts.userId}`).emit('notification', {
          id: saved.id,
          type: saved.type,
          payload: saved.payload,
          created_at: saved.created_at,
        });
      }
    } catch (e) {
      // fallback — the notification is persisted and can be delivered later
    }

    // Optionally enqueue push notifications in a job queue here

    return saved;
  }

  async listForUser(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.notificationRepo.find({
      where: { user: { id: userId } as User },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });
  }
}
