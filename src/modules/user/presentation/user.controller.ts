import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UserService } from '../application/services/user.service';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';



@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    getUserInfo(@Request() req) {
        return this.userService.findUserByEmail(req.user.email);
    }


}
