import {
	Controller,
	Get,
	NotFoundException,
	Post,
	Request,
	UseGuards,
	Body,
	Patch,
	Delete,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../application/services/user.service';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from '../application/mappers/user.mapper';
import { User } from '../domain/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UploadProfilePicDto } from './dto/upload-profile-pic.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly configService: ConfigService,
	) { }

	@Get('profile')
	async getUserInfo(@Request() req): Promise<UserResponseDto> {
		const user = await this.userService.findUserByEmail(req.user.email);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return UserMapper.toResponse(user);
	}

	@Patch('profile')
	async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
		return this.userService.updateProfile(user.id, dto);
	}

	@Delete('profile')
	async deleteProfile(@CurrentUser() user: User) {
		await this.userService.deleteProfile(user.id);
		return { message: 'User account deleted successfully' };
	}

	@Post('profile/picture')
	async uploadProfilePic(
		@CurrentUser() user: User,
		@Body() dto: UploadProfilePicDto,
	) {
		return this.userService.uploadProfilePicBase64(
			user.id,
			dto.base64,
			dto.mimetype,
		);
	}

	@Get('profile/picture')
	async getProfilePic(@CurrentUser() user: User) {
		return this.userService.getProfilePic(user.id);
	}

	@Patch('change-password')
	async changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
		return this.userService.changePassword(user.id, dto);
	}
}
