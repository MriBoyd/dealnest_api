import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SwaggerSyncModule } from 'nestjs-swagger-sync';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsModule } from './modules/listings/listings.module';
import { MediaModule } from './modules/media/media.module';
import { AdminModule } from './modules/admin/admin.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { KycModule } from './modules/kyc/kyc.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdsModule } from './modules/ads/ads.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SwaggerSyncModule.register({
      apiKey:
        'PMAK-68c91efe594c280001e8a3ec-cc11deccd20f33b15aabd532040b9edfff',
      swaggerPath: 'api',
      baseUrl: 'http://localhost:8000',
      runTest: true,
      collectionName: 'Dealnest',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    ListingsModule,
    MediaModule,
    AdminModule,
    BookingsModule,
    KycModule,
    MessagingModule,
    NotificationsModule,
    AdsModule,
    ReviewsModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
