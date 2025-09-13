import { Module } from '@nestjs/common';
import { UserService } from './application/services/user/user.service';

@Module({
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
