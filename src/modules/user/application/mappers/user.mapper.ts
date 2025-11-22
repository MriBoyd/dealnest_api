import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../../presentation/dto/user-response.dto';

export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number ?? undefined,
      agent_code: user.agent_code,
      role: user.role,
      preferred_language: user.preferred_language,
      is_email_verified: user.is_email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
