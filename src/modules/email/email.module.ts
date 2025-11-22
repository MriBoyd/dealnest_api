import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './domain/entities/email-verification.entity';
import { EmailService } from './application/services/email.service';
import { Mailer } from './application/services/mailer';
import { ConfigModule } from '@nestjs/config';
import { EmailController } from './presentation/email.controller';
import { User } from '../user/domain/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmailVerification, User]), forwardRef(() => AuthModule), ConfigModule],
  providers: [EmailService, Mailer],
  controllers: [EmailController],
  exports: [EmailService, Mailer],
})
export class EmailModule {}