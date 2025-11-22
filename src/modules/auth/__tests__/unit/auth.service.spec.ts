import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../../../auth/application/services/auth.service';
import { User } from '../../../user/domain/entities/user.entity';
import { UserService } from '../../../user/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { Mailer } from '../../../email/application/services/mailer';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import { Role } from 'src/common/enums/role.enum';

jest.mock('bcrypt', () => ({
  compare: jest.fn(async (a: string, b: string) => a === b),
  hash: jest.fn(async (v: string) => `hashed:${v}`),
}));

function repoMock<T>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
  } as unknown as jest.Mocked<Repository<any>>;
}

describe('AuthService (Unit)', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let userService: jest.Mocked<UserService>;
  let jwt: jest.Mocked<JwtService>;
  let mailer: jest.Mocked<Mailer>;
  let passwordResetTokenRepo: jest.Mocked<Repository<PasswordResetToken>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repoMock<User>() },
        { provide: getRepositoryToken(PasswordResetToken), useValue: repoMock<PasswordResetToken>() },
        { provide: UserService, useValue: { findUserByEmail: jest.fn(), createUser: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token-123') } },
        { provide: Mailer, useValue: { sendPasswordResetEmail: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    userService = moduleRef.get(UserService);
    jwt = moduleRef.get(JwtService);
    mailer = moduleRef.get(Mailer);
    passwordResetTokenRepo = moduleRef.get(getRepositoryToken(PasswordResetToken));
  });

  it('validateUser fails for missing user/password', async () => {
    userService.findUserByEmail.mockResolvedValue({ password_hash: undefined } as User);
    await expect(service.validateUser('x@example.com', 'pwd')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validateUser fails on invalid password', async () => {
    userService.findUserByEmail.mockResolvedValue({ password_hash: 'hashed:other' } as User);
    await expect(service.validateUser('x@example.com', 'pwd')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validateUser returns mapped user on success', async () => {
    userService.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'u@t.com', name: 'U', role: 'individual_buyer', password_hash: 'pwd' } as User);
    const res = await service.validateUser('u@t.com', 'pwd');
    expect(res.email).toBe('u@t.com');
  });

  it('login returns jwt token', async () => {
    const result = await service.login({ id: 'u1', email: 'u@t.com', name: 'U', role: 'individual_buyer' } as UserResponseDto);
    expect(result.access_token).toBe('token-123');
    expect(jwt.sign).toHaveBeenCalled();
  });

  it('requestPasswordReset sets token and emails user', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com' } as User);
    userRepo.save.mockImplementation(async (u: any) => u);
    const res = await service.requestPasswordReset({ email: 'a@b.com' });
    expect(res.message).toBeDefined();
  });

  it('resetPassword updates hash and clears token', async () => {
    const mockUser: User = {
      id: 'u1',
      email: 'a@b.com',
      name: 'Test User',
      role: 'individual_buyer' as Role, 
      has_kyc: false,
      is_email_verified: false,
      preferred_language: 'en',
      created_at: new Date(),
      updated_at: new Date(),
    } as User;

    // Mock PasswordResetToken entity for the token
    passwordResetTokenRepo.findOne.mockResolvedValue({
      token: 't1',
      user: mockUser,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      consumed_at: null,
      save: jest.fn(),
    } as any);
    userRepo.save.mockImplementation(async (u: any) => u);
    const res = await service.resetPassword({ token: 't1', new_password: 'new-password' });
    expect(res.message).toContain('successful');
  });
});
