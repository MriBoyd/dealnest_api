import { Module } from '@nestjs/common';
import { AuthService } from './application/services/auth/auth.service';
import { AuthController } from './presentation/auth/auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/config/jwt.config';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UserModule,
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: '60s' }
    })
  ],
})
export class AuthModule { }
