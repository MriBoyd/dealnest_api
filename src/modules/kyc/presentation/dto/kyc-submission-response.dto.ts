// src/modules/kyc/presentation/dto/kyc-submission-response.dto.ts

export class KycSubmissionResponseDto {
    kycId: string;
    userId: string;
    userName: string;
    userEmail: string;
    submittedAt: Date;
    kycStatus: string;
}