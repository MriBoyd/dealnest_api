import request from 'supertest';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';

describe('KYC E2E', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useWebSocketAdapter(new IoAdapter(app.getHttpServer()));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/kyc/status (GET) - should require auth', async () => {
    const res = await request(app.getHttpServer()).get('/kyc/status');
    expect(res.status).toBe(401);
  });

  // Add e2e tests for user KYC endpoints only
  // Example stub for uploadDocs (requires auth):
  // it('/kyc/docs (POST) - should upload docs (stub)', async () => {
  //   // Implement with auth and multipart upload
  //   expect(true).toBe(true);
  // });
});
