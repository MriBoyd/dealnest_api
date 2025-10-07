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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
    }),
    SwaggerSyncModule.register({
      apiKey: 'PMAK-68c91efe594c280001e8a3ec-cc11deccd20f33b15aabd532040b9edfff',
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
