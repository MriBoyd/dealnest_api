import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kyc } from '../../domain/entities/kyc.entity';
import { User } from '../../../user/domain/entities/user.entity';
import Multer from 'multer';
import { KycStatus } from 'src/modules/user/domain/enums/kyc-status.enum';

@Injectable()
export class KycService {
	constructor(
		@InjectRepository(Kyc) private readonly kycRepo: Repository<Kyc>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		private readonly dataSource: DataSource,
	) { }

	async uploadDocs(
		user: User,
		files: {
			gov_id_front: Multer.File;
			gov_id_back: Multer.File;
			selfie: Multer.File;
		},
	): Promise<Kyc> {
		return this.dataSource.transaction(async (em) => {
			let kyc = await em.findOne(Kyc, { where: { user: { id: user.id } } });
			if (!kyc) {
				kyc = em.create(Kyc, { user });
			}
			kyc.gov_id_front_filename = files.gov_id_front.originalname;
			kyc.gov_id_front_mimetype = files.gov_id_front.mimetype;
			kyc.gov_id_front_data = files.gov_id_front.buffer;
			kyc.gov_id_back_filename = files.gov_id_back.originalname;
			kyc.gov_id_back_mimetype = files.gov_id_back.mimetype;
			kyc.gov_id_back_data = files.gov_id_back.buffer;
			kyc.selfie_filename = files.selfie.originalname;
			kyc.selfie_mimetype = files.selfie.mimetype;
			kyc.selfie_data = files.selfie.buffer;
			kyc.kyc_status = KycStatus.PENDING;
			kyc.kyc_notes = null;
			await em.save(Kyc, kyc);
			return kyc;
		});
	}

	async getStatus(user: User) {
		const kyc = await this.kycRepo.findOne({ where: { user: { id: user.id } }, relations: ['user'] });
		if (!kyc) throw new NotFoundException('KYC record not found for this user.');
		return { status: kyc.kyc_status, notes: kyc.kyc_notes };
	}

	// Admin methods moved to AdminKycService
}
