import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SwaggerSyncModule } from 'nestjs-swagger-sync';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsModule } from './modules/listings/listings.module';
@Module({
  imports: [UserModule, AuthModule, ConfigModule.forRoot(), SwaggerSyncModule.register({
    apiKey: 'PMAK-68c91efe594c280001e8a3ec-cc11deccd20f33b15aabd532040b9edfff',
    swaggerPath: 'api',
    baseUrl: 'http://localhost:8000',
    runTest: true,
    collectionName: 'Dealnest',

  }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'dealnest',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    ListingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
