import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/modules/auth/infrastructure/adapters/email.service';
import { Role } from '../src/common/enums/role.enum';

dotenv.config({ path: '.env.test' });

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({ sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register creates user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        phone_number: '+251912345678',
        email: 'auth.e2e@example.com',
        password: 'password123',
        name: 'Auth E2E',
        role: Role.INDIVIDUAL_BUYER,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });

  it('POST /auth/login returns access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'auth.e2e@example.com', password: 'password123' })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
  });
});
