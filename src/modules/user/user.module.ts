import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './application/services/user.service';
import { UserController } from './presentation/user.controller';
import { User } from './domain/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';

@Module({
	providers: [UserService],
	exports: [UserService],
	controllers: [UserController],
	imports: [
		TypeOrmModule.forFeature([User]),
		forwardRef(() => AuthModule),
		MediaModule
	],
})
export class UserModule { }
