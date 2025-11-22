
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../../../common/enums/role.enum';

describe('UserController (e2e)', () => {
  let app: NestFastifyApplication;
  let token: string;
  let userId: string;
  
  const mockUser = {
    id: 'a-uuid',
    email: 'test@example.com',
    role: Role.INDIVIDUAL_BUYER,
    name: 'Test User',
    phone_number: '1234567890',
    password_hash: 'hashedpassword',
  };
  
  
  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue(mockUser),
    save: jest.fn().mockImplementation(user => Promise.resolve(user)),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  jest.mock('bcrypt', () => ({
    compare: jest.fn().mockResolvedValue(true),
    hash: jest.fn().mockResolvedValue('newhashedpassword'),
  }));

  beforeAll(async () => {

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        }
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('/user/profile (GET)', () => {
    return request.agent(app.getHttpServer())
      .get('/user/profile')
      .expect(200)
      .expect(res => {
        expect(res.body.email).toEqual(mockUser.email);
      });
  });

  it('/user/profile (PATCH)', () => {
    const updateDto = { name: 'Updated Name' };
    return request.agent(app.getHttpServer())
      .patch('/user/profile')
      .send(updateDto)
      .expect(200)
      .expect(res => {
        expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      });
  });

  it('/user/profile (DELETE)', () => {
    return request.agent(app.getHttpServer())
      .delete('/user/profile')
      .expect(200)
      .expect({ message: 'User account deleted successfully' });
  });

  it('/user/change-password (PATCH)', () => {
    const changePasswordDto = { current_password: 'password', new_password: 'newpassword' };
    return request.agent(app.getHttpServer())
      .patch('/user/change-password')
      .send(changePasswordDto)
      .expect(200)
      .expect({ message: 'Password changed successfully' });
  });


  afterAll(async () => {
    await app.close();
  });
});