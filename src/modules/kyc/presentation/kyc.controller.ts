// src/modules/kyc/presentation/kyc.controller.ts
import { Controller, Post, Get, UploadedFiles, UseInterceptors, UseGuards, BadRequestException } from '@nestjs/common';
import { Multer } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { KycService } from '../application/services/kyc.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';

@Controller('kyc')
@UseGuards(JwtAuthGuard)    
export class KycController {
    constructor(private readonly kycService: KycService) { }

    @Post('docs')
    @UseInterceptors(FilesInterceptor('files'))
    async uploadDocs(@UploadedFiles() files: Multer.File[], @CurrentUser() user: User) {
        if (!files || files.length !== 3) {
            throw new BadRequestException('Please upload exactly three files: government ID front, government ID back, and a selfie.');
        }
        return this.kycService.uploadDocs(user, files);
    }

    @Get('status')
    async getStatus(@CurrentUser() user: User) {
        return this.kycService.getStatus(user);
    }
}
