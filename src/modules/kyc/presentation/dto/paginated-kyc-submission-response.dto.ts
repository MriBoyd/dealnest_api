// src/modules/kyc/presentation/dto/paginated-kyc-submission-response.dto.ts
import { KycSubmissionResponseDto } from './kyc-submission-response.dto';

class PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class PaginatedKycSubmissionResponseDto {
    data: KycSubmissionResponseDto[];
    meta: PaginationMeta;
}