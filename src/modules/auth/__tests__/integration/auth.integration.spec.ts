import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { testDatabaseConfig } from '../../../../config/test-database.config';
import { AuthService } from '../../application/services/auth.service';
import { User } from '../../../user/domain/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from '../../infrastructure/adapters/email.service';
import { UserService } from '../../../user/application/services/user.service';


describe('AuthService (Integration)', () => {
  let service: AuthService;
  let users: Repository<User>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        TypeOrmModule.forFeature([User]),
        JwtModule.register({ secret: 'testsecret' }),
      ],
      providers: [
        AuthService,
        { provide: UserService, useValue: { findUserByEmail: jest.fn(), createUser: jest.fn() } },
        { provide: EmailService, useValue: { sendPasswordResetEmail: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    users = moduleRef.get('UserRepository');

    await users.query('TRUNCATE TABLE "users" CASCADE;');
  });

  it('requestPasswordReset saves token and expiry', async () => {
    await users.save({ email: 'int@a.com', name: 'Int', role: 'individual_buyer' } as any);
    const res = await service.requestPasswordReset({ email: 'int@a.com' });
    expect(res.message).toBeDefined();

    const updated = await users.findOne({ where: { email: 'int@a.com' } });
    expect(updated?.email_verification_token).toBeDefined();
    expect(updated?.email_verification_expires).toBeInstanceOf(Date);
  });

  it('resetPassword updates hash and clears fields', async () => {
    const u = await users.save({ email: 'int2@a.com', name: 'Int2', role: 'individual_buyer', email_verification_token: 'tok', email_verification_expires: new Date(Date.now() + 3600000) } as any);
    const res = await service.resetPassword({ token: 'tok', new_password: 'newpassword123' });
    expect(res.message).toContain('successful');

    const updated = await users.findOne({ where: { id: u.id } });
    expect(updated?.email_verification_token).toBeNull();
    expect(updated?.email_verification_expires).toBeNull();
    expect(updated?.password_hash).toBeDefined();
  });
});
