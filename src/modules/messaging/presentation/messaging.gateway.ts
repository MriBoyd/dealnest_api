import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../../notifications/application/services/notifications.service';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageResponseDto } from '../application/mappers/message.mapper';

@WebSocketGateway({
  cors: { origin: true },
  namespace: '/ws',
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Accept token via auth in handshake: { auth: { token } }
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload: any = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;

      // Join a user-specific room for direct notifications
      client.join(`user_${userId}`);

      // let notifications service emit to sockets
      this.notificationsService.setIoServer(this.server);
    } catch (err) {
      console.error('Error in handleConnection', err);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    // nothing special for now; presence can be tracked in Redis or DB
  }

  @OnEvent('message.sent')
  handleMessageSent(payload: {
    threadId: string;
    response: MessageResponseDto;
    senderId: string;
  }) {
    const senderSocket = this.server.sockets.sockets.forEach((socket) => {
      if (socket.data.userId === payload.senderId) {
        socket
          .to(`thread_${payload.threadId}`)
          .except(socket.id)
          .emit('message', payload.response);
      }
    });
  }

  @SubscribeMessage('join_thread')
  handleJoinThread(
    @MessageBody() payload: { threadId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`thread_${payload.threadId}`);
  }

  @SubscribeMessage('leave_thread')
  handleLeaveThread(
    @MessageBody() payload: { threadId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`thread_${payload.threadId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { threadId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    // broadcast typing to thread participants
    client.to(`thread_${payload.threadId}`).emit('typing', {
      userId,
      threadId: payload.threadId,
      isTyping: payload.isTyping,
    });
  }
}
