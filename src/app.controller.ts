import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { SwaggerSyncService } from 'nestjs-swagger-sync';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly swaggerSyncService: SwaggerSyncService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('sync')
  async syncSwagger() {
    await this.swaggerSyncService.syncSwagger();
    return { message: 'Swagger documentation synced with Postman' };
  }
}
