import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '../../presentation/dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/modules/auth/infrastructure/adapters/email.service';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../../presentation/dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import {
  DEFAULT_PROFILE_PIC_BASE64,
  DEFAULT_PROFILE_PIC_MIMETYPE,
} from 'src/config/defaults';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private emailService: EmailService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    isOAuth = false,
  ): Promise<UserResponseDto> {
    const { phone_number, email, password, name } = createUserDto;

    const existing = await this.userRepo.findOne({
      where: [{ phone_number: phone_number || undefined }, { email }],
    });

    if (existing) {
      throw new ConflictException('User already exists.');
    }

    let password_hash: string | undefined = undefined;
    let is_email_verified = false;

    // If password is provided, treat as non-OAuth (require password, do not allow verified)
    if (password) {
      if (!password || password.length < 8) {
        throw new BadRequestException(
          'Password is required and must be at least 8 characters.',
        );
      }
      if (createUserDto.is_email_verified) {
        // Never allow client to set this
        throw new BadRequestException(
          'is_email_verified must be false for password-based registration.',
        );
      }
      password_hash = await bcrypt.hash(password, 10);
      is_email_verified = false; // Never allow client to set this for password-based
    } else {
      // Only allow is_email_verified for OAuth if called from trusted OAuth flow
      if (!isOAuth) {
        throw new BadRequestException(
          'registration without password is not allowed.',
        );
      }
      is_email_verified = !!createUserDto.is_email_verified;
      if (!is_email_verified) {
        throw new BadRequestException(
          'OAuth registration must set is_email_verified to true.',
        );
      }
    }

    const user = this.userRepo.create({
      phone_number,
      email,
      password_hash,
      name,
      role: createUserDto.role,
      is_email_verified,
    });

    if (password) {
      await this.generateEmailVerificationToken(user);
    }

    const saved = await this.userRepo.save(user);
    return UserMapper.toResponse(saved);
  }

  async generateEmailVerificationToken(user: User) {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    user.email_verification_token = token;
    user.email_verification_expires = expires;
    await this.userRepo.save(user);

    await this.emailService.sendVerificationEmail(user.email, token);
  }

  // use email and token to verify
  async verifyEmail(email: string, token: string) {
    const user = await this.findUserByEmail(email);

    if (!user) throw new NotFoundException('Invalid token');
    if (
      !user.email_verification_expires ||
      user.email_verification_expires < new Date()
    ) {
      throw new BadRequestException('Token expired');
    }

    user.is_email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (user.is_email_verified) {
      throw new BadRequestException('Email already verified');
    }

    // Rate limiting: allow only once every 10 minutes
    const now = new Date();
    if (
      user.last_verification_email_sent &&
      now.getTime() - user.last_verification_email_sent.getTime() <
        10 * 60 * 1000
    ) {
      throw new BadRequestException('Please wait before requesting again');
    }

    // Generate token
    const token = randomBytes(32).toString('hex');
    user.email_verification_token = token;
    user.email_verification_expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    user.last_verification_email_sent = now;
    await this.userRepo.save(user);

    // Send email
    await this.emailService.sendVerificationEmail(user.email, token);
  }

  async update(id: string, attrs: Partial<User>): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    Object.assign(user, attrs);
    return this.userRepo.save(user);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return plainToInstance(User, user, { excludeExtraneousValues: true });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async uploadProfilePicBase64(
    userId: string,
    base64: string,
    mimetype: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // convert base64 string to Buffer
    const buffer = Buffer.from(base64, 'base64');

    user.profile_pic_mimetype = mimetype;
    user.profile_pic_data = buffer;

    this.userRepo.save(user);

    return UserMapper.toResponse(user);
  }

  async getProfilePic(
    userId: string,
  ): Promise<{ mimetype: string; base64: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user || !user.profile_pic_data) {
      throw new NotFoundException('Profile picture not found');
    }

    return {
      mimetype: user.profile_pic_mimetype ?? DEFAULT_PROFILE_PIC_MIMETYPE,
      base64:
        user.profile_pic_data.toString('base64') ?? DEFAULT_PROFILE_PIC_BASE64,
    };
  }
}
