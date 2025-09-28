export class UserResponseDto {
    id: string;
    name: string;
    role: string;
    email: string;
    preferred_language: string;
    phone_number?: string;
    agent_code?: string;
    is_email_verified: boolean;
    verification_status: 'none' | 'basic' | 'verified' | 'certified';
    created_at: Date;
    updated_at: Date;
}
