// src/modules/kyc/application/services/kyc.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kyc } from '../../domain/entities/kyc.entity';
import { User, KycStatus } from '../../../user/domain/entities/user.entity';
import { Multer } from 'multer';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { UserMapper } from 'src/modules/user/application/mappers/user.mapper';
import { KycDetailsResponseDto } from 'src/modules/kyc/presentation/dto/kyc-details-response.dto';
import { FilterKycDto } from '../../presentation/dto/filter-kyc.dto';
import { PaginatedKycSubmissionResponseDto } from '../../presentation/dto/paginated-kyc-submission-response.dto';

@Injectable()
export class KycService {
    constructor(
        @InjectRepository(Kyc) private readonly kycRepo: Repository<Kyc>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource,
    ) { }

    async uploadDocs(user: User, files: Multer.File[]): Promise<UserResponseDto> {
        // files order: [gov_id_front, gov_id_back, selfie]
        return this.dataSource.transaction(async (transactionalEntityManager) => {
            let kyc = await transactionalEntityManager.findOne(Kyc, { where: { user: { id: user.id } } });

            if (!kyc) {
                kyc = transactionalEntityManager.create(Kyc, { user });
            }

            // Update KYC document data
            kyc.gov_id_front_filename = files[0]?.originalname;
            kyc.gov_id_front_mimetype = files[0]?.mimetype;
            kyc.gov_id_front_data = files[0]?.buffer;
            kyc.gov_id_back_filename = files[1]?.originalname;
            kyc.gov_id_back_mimetype = files[1]?.mimetype;
            kyc.gov_id_back_data = files[1]?.buffer;
            kyc.selfie_filename = files[2]?.originalname;
            kyc.selfie_mimetype = files[2]?.mimetype;
            kyc.selfie_data = files[2]?.buffer;

            user.kyc_status = KycStatus.PENDING;
            user.kyc_notes = null; // Clear previous notes on new submission

            const updatedUser = await transactionalEntityManager.save(User, user);
            await transactionalEntityManager.save(Kyc, kyc); // This will now insert or update

            return UserMapper.toResponse(updatedUser);
        });
    }

    async getStatus(user: User) {
        // The user object from the decorator might be stale.
        const freshUser = await this.userRepo.findOne({ where: { id: user.id } });
        if (!freshUser) throw new NotFoundException('User not found');
        return { status: freshUser.kyc_status, notes: freshUser.kyc_notes };
    }

    async updateStatus(id: string, status: KycStatus, notes?: string): Promise<UserResponseDto> {
        const kycRecord = await this.kycRepo.findOne({ where: { id }, relations: ['user'] });
        if (!kycRecord || !kycRecord.user) throw new NotFoundException('KYC record not found or is not associated with a user');

        const user = kycRecord.user;
        user.kyc_status = status;
        user.kyc_notes = notes;
        const updatedUser = await this.userRepo.save(user);
        return UserMapper.toResponse(updatedUser);
    }

    async listPending(filters: FilterKycDto): Promise<PaginatedKycSubmissionResponseDto> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const sortBy = filters.sortBy ?? 'submittedAt';
        const order = filters.order ?? 'DESC';
        const { search } = filters;
        const skip = (page - 1) * limit;

        const qb = this.kycRepo.createQueryBuilder('kyc')
            .leftJoinAndSelect('kyc.user', 'user')
            .where('user.kyc_status = :status', { status: KycStatus.PENDING });

        if (search) {
            qb.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
        }

        const sortColumnMap = {
            name: 'user.name',
            email: 'user.email',
            submittedAt: 'kyc.created_at',
        };
        const sortColumn = sortColumnMap[sortBy];

        qb.orderBy(sortColumn, order)
            .skip(skip)
            .take(limit);

        const [pendingKycs, total] = await qb.getManyAndCount();

        const data = pendingKycs.map(kyc => ({ kycId: kyc.id, userId: kyc.user.id, userName: kyc.user.name, userEmail: kyc.user.email, submittedAt: kyc.created_at, kycStatus: kyc.user.kyc_status })); 

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
