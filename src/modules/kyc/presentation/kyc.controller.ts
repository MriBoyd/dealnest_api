import {
  Controller,
  Post,
  Get,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { KycService } from '../application/services/kyc.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import Multer from 'multer';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('docs')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'gov_id_front', maxCount: 1 },
      { name: 'gov_id_back', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  async uploadDocs(
    @UploadedFiles()
    files: {
      gov_id_front?: Multer.File[];
      gov_id_back?: Multer.File[];
      selfie?: Multer.File[];
    },
    @CurrentUser() user: User,
  ) {
    const { gov_id_front, gov_id_back, selfie } = files;

    if (!gov_id_front || !gov_id_back || !selfie) {
      throw new BadRequestException(
        'Missing one or more required files (gov_id_front, gov_id_back, selfie).',
      );
    }

    return this.kycService.uploadDocs(user, {
      gov_id_front: gov_id_front[0],
      gov_id_back: gov_id_back[0],
      selfie: selfie[0],
    });
  }

  @Get('status')
  async getStatus(@CurrentUser() user: User) {
    return this.kycService.getStatus(user);
  }
}
