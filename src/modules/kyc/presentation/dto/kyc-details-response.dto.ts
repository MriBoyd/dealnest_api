// src/modules/kyc/presentation/dto/kyc-details-response.dto.ts

interface KycImage {
  mimetype?: string;
  base64?: string;
}

export class KycDetailsResponseDto {
  kycId: string;
  userId: string;
  userName: string;
  userEmail: string;
  submittedAt: Date;
  kycStatus: string;
  govIdFront: KycImage;
  govIdBack: KycImage;
  selfie: KycImage;
}
