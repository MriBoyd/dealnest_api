import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { EmailVerification } from '../../domain/entities/email-verification.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { Mailer } from './mailer';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailVerification) private readonly evRepo: Repository<EmailVerification>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly mailer: Mailer,
  ) {}

  // --- Email Verification Feature ---
  async generateAndSendVerificationToken(user: User): Promise<void> {
    if (user.is_email_verified) return;
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    const record = this.evRepo.create({ user: user, token, expires_at: expires, consumed_at: null });
    await this.evRepo.save(record);
    await this.mailer.sendVerificationEmail(user.email, token);
  }

    async verifyEmail(email: string, token: string): Promise<{ message: string }> {

      if (!email) throw new BadRequestException('Email is required');

      const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('Invalid token');
    if (user.is_email_verified) return { message: 'Email already verified' };

    const record = await this.evRepo.findOne({ where: { token, user: { id: user.id } } });
    if (!record) throw new NotFoundException('Invalid token');
    if (record.consumed_at) throw new BadRequestException('Token already used');
    if (record.expires_at < new Date()) throw new BadRequestException('Token expired');

    user.is_email_verified = true;
    await this.userRepo.save(user);
    record.consumed_at = new Date();
    await this.evRepo.save(record);
    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');
    if (user.is_email_verified) throw new BadRequestException('Email already verified');

    // throttle: last unconsumed or last created within 10 minutes
    const recent = await this.evRepo.find({ where: { user: { id: user.id } }, order: { created_at: 'DESC' }, take: 1 });
    if (recent.length && new Date().getTime() - recent[0].created_at.getTime() < 10 * 60 * 1000) {
      throw new BadRequestException('Please wait before requesting again');
    }
    await this.generateAndSendVerificationToken(user);
    return { message: 'Verification email resent' };
  }

  // --- Future: add more email features here ---
}