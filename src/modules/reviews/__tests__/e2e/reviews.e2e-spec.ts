import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../app.module';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('Reviews (E2E)', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();

        // Optionally: login as test user
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password' });
        token = loginRes.body.access_token;
    });

    it('/POST reviews → creates new review', async () => {
        const res = await request(app.getHttpServer())
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({
                targetType: 'listing',
                targetId: 'listing-uuid',
                rating: 5,
                comment: 'Loved it!',
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    afterAll(async () => {
        await app.close();
    });
});
