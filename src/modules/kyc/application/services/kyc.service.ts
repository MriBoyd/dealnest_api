import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kyc } from '../../domain/entities/kyc.entity';
import { User, KycStatus } from '../../../user/domain/entities/user.entity';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { UserMapper } from 'src/modules/user/application/mappers/user.mapper';
import { KycDetailsResponseDto } from 'src/modules/kyc/presentation/dto/kyc-details-response.dto';
import { FilterKycDto } from '../../presentation/dto/filter-kyc.dto';
import { PaginatedKycSubmissionResponseDto } from '../../presentation/dto/paginated-kyc-submission-response.dto';
import Multer from 'multer';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc) private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async uploadDocs(
    user: User,
    files: {
      gov_id_front: Multer.File;
      gov_id_back: Multer.File;
      selfie: Multer.File;
    },
  ): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      let kyc = await transactionalEntityManager.findOne(Kyc, {
        where: { user: { id: user.id } },
      });

      if (!kyc) {
        kyc = transactionalEntityManager.create(Kyc, { user });
      }

      // Destructure and update from named files
      const { gov_id_front, gov_id_back, selfie } = files;

      kyc.gov_id_front_filename = gov_id_front.originalname;
      kyc.gov_id_front_mimetype = gov_id_front.mimetype;
      kyc.gov_id_front_data = gov_id_front.buffer;

      kyc.gov_id_back_filename = gov_id_back.originalname;
      kyc.gov_id_back_mimetype = gov_id_back.mimetype;
      kyc.gov_id_back_data = gov_id_back.buffer;

      kyc.selfie_filename = selfie.originalname;
      kyc.selfie_mimetype = selfie.mimetype;
      kyc.selfie_data = selfie.buffer;

      user.kyc_status = KycStatus.PENDING;
      user.kyc_notes = null; // Clear previous notes on new submission

      const updatedUser = await transactionalEntityManager.save(User, user);
      await transactionalEntityManager.save(Kyc, kyc);

      return UserMapper.toResponse(updatedUser);
    });
  }

  async getStatus(user: User) {
    // The user object from the decorator might be stale.
    const freshUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (!freshUser) throw new NotFoundException('User not found');
    return { status: freshUser.kyc_status, notes: freshUser.kyc_notes };
  }

  async updateStatus(
    id: string,
    status: KycStatus,
    notes?: string,
  ): Promise<UserResponseDto> {
    const kycRecord = await this.kycRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!kycRecord || !kycRecord.user)
      throw new NotFoundException(
        'KYC record not found or is not associated with a user',
      );

    const user = kycRecord.user;
    user.kyc_status = status;
    user.kyc_notes = notes;
    const updatedUser = await this.userRepo.save(user);
    return UserMapper.toResponse(updatedUser);
  }

  async listPending(
    filters: FilterKycDto,
  ): Promise<PaginatedKycSubmissionResponseDto> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const sortBy = filters.sortBy ?? 'submittedAt';
    const order = filters.order ?? 'DESC';
    const { search } = filters;
    const skip = (page - 1) * limit;

    const qb = this.kycRepo
      .createQueryBuilder('kyc')
      .leftJoinAndSelect('kyc.user', 'user')
      .where('user.kyc_status = :status', { status: KycStatus.PENDING });

    if (search) {
      qb.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const sortColumnMap = {
      name: 'user.name',
      email: 'user.email',
      submittedAt: 'kyc.created_at',
    };
    const sortColumn = sortColumnMap[sortBy];

    qb.orderBy(sortColumn, order).skip(skip).take(limit);

    const [pendingKycs, total] = await qb.getManyAndCount();

    const data = pendingKycs.map((kyc) => ({
      kycId: kyc.id,
      userId: kyc.user.id,
      userName: kyc.user.name,
      userEmail: kyc.user.email,
      submittedAt: kyc.created_at,
      kycStatus: kyc.user.kyc_status,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getKycDetails(id: string): Promise<KycDetailsResponseDto> {
    const kycRecord = await this.kycRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!kycRecord || !kycRecord.user) {
      throw new NotFoundException(`KYC submission with ID "${id}" not found.`);
    }

    return {
      kycId: kycRecord.id,
      userId: kycRecord.user.id,
      userName: kycRecord.user.name,
      userEmail: kycRecord.user.email,
      submittedAt: kycRecord.created_at,
      kycStatus: kycRecord.user.kyc_status,
      govIdFront: {
        mimetype: kycRecord.gov_id_front_mimetype,
        base64: kycRecord.gov_id_front_data?.toString('base64'),
      },
      govIdBack: {
        mimetype: kycRecord.gov_id_back_mimetype,
        base64: kycRecord.gov_id_back_data?.toString('base64'),
      },
      selfie: {
        mimetype: kycRecord.selfie_mimetype,
        base64: kycRecord.selfie_data?.toString('base64'),
      },
    };
  }
}
