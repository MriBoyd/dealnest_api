import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './application/services/auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './presentation/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { EmailService } from './infrastructure/adapters/email.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h') },
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, EmailService],
  controllers: [AuthController],
  exports: [EmailService],


})
export class AuthModule { }
