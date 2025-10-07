import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import { createAdapter } from 'socket.io-redis';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = Number(process.env.REDIS_PORT || 6379);
  // @ts-ignore
  const ioAdapter = new IoAdapter(app);
  // @ts-ignore
  const serverOptions: ServerOptions = {
    // adapter will be set below using createAdapter
  };

  app.use(json({ limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe());

  const options = new DocumentBuilder()
    .setTitle('Dealnest API')
    .setDescription('The Dealnest API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
