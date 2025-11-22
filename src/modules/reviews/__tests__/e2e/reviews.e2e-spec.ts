import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { Listing } from 'src/modules/listings/domain/entities/listing.entity';
import { Review } from 'src/modules/reviews/domain/entities/review.entity';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { Repository } from 'typeorm';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { Role } from 'src/common/enums/role.enum';

describe('Reviews (E2E)', () => {
    let app: NestFastifyApplication;
    let token: string;
    let testUser: User;
    let testListing: Listing;
    let userRepository: Repository<User>;
    let listingRepository: Repository<Listing>;
    let reviewRepository: Repository<Review>;
    let authService: AuthService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({ whitelist: true }));
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        // Get services and repositories from the testing module
        authService = moduleRef.get<AuthService>(AuthService);
        userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
        listingRepository = moduleRef.get<Repository<Listing>>(getRepositoryToken(Listing));
        reviewRepository = moduleRef.get<Repository<Review>>(getRepositoryToken(Review));

        // Clean DB and create user/listing
        await reviewRepository.query(`TRUNCATE TABLE "${reviewRepository.metadata.tableName}" CASCADE`);
        await listingRepository.query(`TRUNCATE TABLE "${listingRepository.metadata.tableName}" CASCADE`);
        await userRepository.query(`TRUNCATE TABLE "${userRepository.metadata.tableName}" CASCADE`);

        const newUser = userRepository.create({
            name: 'Test User',
            email: 'test@example.com',
            password_hash: 'password', // or hash it if needed
            role: Role.INDIVIDUAL_BUYER,
        });
        testUser = await userRepository.save(newUser);
        testListing = await listingRepository.save(
            listingRepository.create({ title: 'Test Listing', description: 'Test description', owner: testUser, price: 100, currency: 'ETB', city: 'Addis', address: 'Address' }),
        );
        token = (await authService.login(testUser as UserResponseDto)).access_token;
    });

    it('/POST reviews → creates new review', async () => {
        const res = await request(app.getHttpServer())
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({
                targetType: 'listing',
                targetId: testListing.id,
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
