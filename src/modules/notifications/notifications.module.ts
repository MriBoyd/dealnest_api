import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './domain/entities/notification.entity';
import { PushToken } from './domain/entities/push-token.entity';
import { NotificationsService } from './application/services/notifications.service';
import { User } from '../user/domain/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, PushToken, User])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
