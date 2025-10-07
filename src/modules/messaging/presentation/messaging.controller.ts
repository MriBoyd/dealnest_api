import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { MessagingService } from '../application/services/messaging.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('threads')
export class MessagingController {
    constructor(private readonly messagingService: MessagingService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createThread(@CurrentUser() user: User, @Body() dto: CreateThreadDto) {
        return this.messagingService.createThread(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/messages')
    async postMessage(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() dto: SendMessageDto,
    ) {
        return this.messagingService.sendMessage(
            user.id,
            id,
            dto.text,
            dto.mediaId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/messages')
    async getMessages(
        @Param('id') id: string,
        @Query('page') page = '1',
        @Query('limit') limit = '50',
    ) {
        return this.messagingService.listMessages(id, Number(page), Number(limit));
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async listThreads(@CurrentUser() user: User) {
        return this.messagingService.listThreadsForUser(user.id);
    }
}
