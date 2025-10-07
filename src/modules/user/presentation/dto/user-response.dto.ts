export class UserResponseDto {
  id: string;
  name: string;
  role: string;
  email: string;
  preferred_language: string;
  phone_number?: string;
  agent_code?: string;
  kyc_status: string;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}
