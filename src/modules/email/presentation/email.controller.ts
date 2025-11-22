import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { EmailService } from '../application/services/email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Email verification endpoints
  @Get('verification/verify')
  async verify(@Query('email') email: string, @Query('token') token: string) {
    return this.emailService.verifyEmail(email, token);
  }

  @Post('verification/resend')
  async resend(@Body('email') email: string) {
    return this.emailService.resendVerificationEmail(email);
  }
}