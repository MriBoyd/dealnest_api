import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
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

  // Email verification endpoints moved to EmailVerificationController

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
