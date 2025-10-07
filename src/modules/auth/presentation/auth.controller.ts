import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../application/services/auth.service';
import { LocalAuthGuard } from '../infrastructure/guards/local-auth.guard';
import { CreateUserDto } from 'src/modules/user/presentation/dto/create-user.dto';
import { UserService } from 'src/modules/user/application/services/user.service';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { UserMapper } from 'src/modules/user/application/mappers/user.mapper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // return 200 on successful login
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  // return 201 on successful registration
  @HttpCode(201)
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Post('logout')
  @UseGuards(LocalAuthGuard)
  async logout() {
    return { message: 'Logout successful' };
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('email') email: string,
    @Query('token') token: string,
  ) {
    return this.userService.verifyEmail(email, token);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests / 60 seconds
  async resendVerification(@Body('email') email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      // security: do not reveal user existence
      return { message: 'If this email exists, a verification link was sent' };
    }

    await this.userService.resendVerificationEmail(user.id);
    return { message: 'Verification email resent (if not already verified)' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    // issue JWT here
    return this.authService.login(UserMapper.toResponse(req.user));
  }
}
