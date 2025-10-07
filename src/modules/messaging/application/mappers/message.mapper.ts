import { UserMapper } from 'src/modules/user/application/mappers/user.mapper';
import { Message } from '../../domain/entities/message.entity';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';

export class MessageResponseDto {
  id: string;
  thread: { id: string };
  sender: UserResponseDto;
  text?: string | null;
  media_id?: string | null;
  type: 'text' | 'image' | 'video' | 'system';
  created_at: Date;
}

export class MessageMapper {
  static toResponse(message: Message): MessageResponseDto {
    const response = new MessageResponseDto();
    Object.assign(response, message);
    response.thread = { id: message.thread.id };
    response.sender = UserMapper.toResponse(message.sender);
    return response;
  }
}
