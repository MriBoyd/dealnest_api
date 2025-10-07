// auth/auth.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';
import { UserMapper } from 'src/modules/user/application/mappers/user.mapper';
import { UserService } from 'src/modules/user/application/services/user.service';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    return UserMapper.toResponse(user);
  }

  async validateOAuthLogin(email: string, name: string) {
    try {
      const user = await this.usersService.findUserByEmail(email);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        const user = await this.usersService.createUser(
          {
            email,
            name,
            phone_number: null,
            password: null,
            role: Role.INDIVIDUAL_BUYER,
            is_email_verified: true,
          },
          true,
        );
        return user;
      }
      throw error;
    }
  }

  async login(user: UserResponseDto) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
