import { Controller, Get, NotFoundException, Request, UseGuards } from '@nestjs/common';
import { UserService } from '../application/services/user.service';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from '../application/mappers/user.mapper';



@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getUserInfo(@Request() req): Promise<UserResponseDto> {
        const user = await this.userService.findUserByEmail(req.user.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return UserMapper.toResponse(user);
    }


}
