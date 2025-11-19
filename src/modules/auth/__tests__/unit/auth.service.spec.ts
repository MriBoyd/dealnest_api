import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../../../auth/application/services/auth.service';
import { User } from '../../../user/domain/entities/user.entity';
import { UserService } from '../../../user/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../../auth/infrastructure/adapters/email.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';

jest.mock('bcrypt', () => ({
  compare: jest.fn(async (a: string, b: string) => a === b),
  hash: jest.fn(async (v: string) => `hashed:${v}`),
}));

function repoMock<T>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<any>>;
}

describe('AuthService (Unit)', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let userService: jest.Mocked<UserService>;
  let jwt: jest.Mocked<JwtService>;
  let email: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repoMock<User>() },
        { provide: UserService, useValue: { findUserByEmail: jest.fn(), createUser: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token-123') } },
        { provide: EmailService, useValue: { sendPasswordResetEmail: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    userService = moduleRef.get(UserService);
    jwt = moduleRef.get(JwtService);
    email = moduleRef.get(EmailService);
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
    userRepo.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', email_verification_token: 't1', email_verification_expires: new Date(Date.now() + 10000) } as User);
    userRepo.save.mockImplementation(async (u: any) => u);
    const res = await service.resetPassword({ token: 't1', new_password: 'new-password' });
    expect(res.message).toContain('successful');
  });
});
