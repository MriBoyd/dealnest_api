import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../application/services/user.service';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from '../application/mappers/user.mapper';
import { User } from '../domain/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UploadProfilePicDto } from './dto/upload-profile-pic.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Get('me')
  async getUserInfo(@Request() req): Promise<UserResponseDto> {
    const user = await this.userService.findUserByEmail(req.user.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserMapper.toResponse(user);
  }

  @Post('profile-pic')
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

  @Get('profile-pic')
  async getProfilePic(@CurrentUser() user: User) {
    return this.userService.getProfilePic(user.id);
  }
}
