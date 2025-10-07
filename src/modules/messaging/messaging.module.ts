import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageThread } from './domain/entities/message-thread.entity';
import { Participant } from './domain/entities/participant.entity';
import { Message } from './domain/entities/message.entity';
import { MessagingService } from './application/services/messaging.service';
import { MessagingGateway } from './presentation/messaging.gateway';
import { MessagingController } from './presentation/messaging.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../user/domain/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageThread, Participant, Message, User]),
    forwardRef(() => NotificationsModule),
    AuthModule,
  ],
  providers: [MessagingService, MessagingGateway],
  controllers: [MessagingController],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
