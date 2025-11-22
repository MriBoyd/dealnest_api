import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { AppModule } from '../src/app.module';
import { Role } from '../src/common/enums/role.enum';
import { EmailService } from '../src/modules/email/application/services/email.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

dotenv.config({ path: '.env.test' });

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
        generateAndSendVerificationToken: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
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
