import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc } from '../../../kyc/domain/entities/kyc.entity';
import { User } from '../../../user/domain/entities/user.entity';
import { KycStatus } from 'src/modules/user/domain/enums/kyc-status.enum';

@Injectable()
export class AdminKycService {
  constructor(
    @InjectRepository(Kyc) private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async listPending(page = 1, limit = 10): Promise<{ data: Kyc[]; total: number; page: number; limit: number; }> {
    const [data, total] = await this.kycRepo.findAndCount({
      where: { kyc_status: KycStatus.PENDING },
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async getKycDetails(id: string): Promise<Kyc> {
    const kyc = await this.kycRepo.findOne({ where: { id }, relations: ['user'] });
    if (!kyc || !kyc.user) throw new NotFoundException(`KYC submission with ID "${id}" not found.`);
    return kyc;
  }

  async updateStatus(id: string, status: KycStatus, notes?: string): Promise<Kyc> {
    const kyc = await this.kycRepo.findOne({ where: { id }, relations: ['user'] });
    if (!kyc || !kyc.user) throw new NotFoundException('KYC record not found or is not associated with a user');
    kyc.kyc_status = status;
    kyc.kyc_notes = notes;
    return this.kycRepo.save(kyc);
  }
}
