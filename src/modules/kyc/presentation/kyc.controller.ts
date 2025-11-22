
import {
	Controller,
	Post,
	Get,
	UploadedFiles,
	UseInterceptors,
	UseGuards,
	BadRequestException,
	UnauthorizedException,

} from '@nestjs/common';
import { KycService } from '../application/services/kyc.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FileFieldsInterceptor } from '@blazity/nest-file-fastify';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import Multer from 'multer';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
	constructor(private readonly kycService: KycService) { }

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
		if (!files.gov_id_front || !files.gov_id_back || !files.selfie) {
			throw new BadRequestException('Missing one or more required files (gov_id_front, gov_id_back, selfie).');
		}
		return this.kycService.uploadDocs(user, {
			gov_id_front: files.gov_id_front[0],
			gov_id_back: files.gov_id_back[0],
			selfie: files.selfie[0],
		});
	}

	@Get('status')
	async getStatus(@CurrentUser() user: User) {
		if (!user) {
			throw new UnauthorizedException('Unauthorized');
		}
		return this.kycService.getStatus(user);
	}

}
