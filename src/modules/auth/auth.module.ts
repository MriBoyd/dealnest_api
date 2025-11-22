import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './presentation/auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/domain/entities/user.entity';
import { PasswordResetToken } from './domain/entities/password-reset-token.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => EmailModule),
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,

  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
