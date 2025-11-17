import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { AuthGuard } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../../../common/enums/role.enum';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let userId: string;

  const mockUser = {
    id: 'a-uuid',
    email: 'test@example.com',
    role: Role.INDIVIDUAL_BUYER,
    name: 'Test User',
    phone_number: '1234567890',
  };

  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue(mockUser),
    save: jest.fn().mockImplementation(user => Promise.resolve(user)),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
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

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
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
    // Mock bcrypt functions for this test
    jest.mock('bcrypt', () => ({
      compare: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('newhashedpassword'),
    }));

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