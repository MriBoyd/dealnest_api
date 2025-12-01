
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ bodyLimit: 50 * 1024 * 1024 });

  // Register Fastify plugins for body parsing and multipart
  await fastifyAdapter.register(require('@fastify/formbody'));
  await fastifyAdapter.register(require('@fastify/multipart'));


  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  app.useWebSocketAdapter(new IoAdapter(app.getHttpServer()));
  app.useGlobalPipes(new ValidationPipe());

  const options = new DocumentBuilder()
    .setTitle('Dealnest API')
    .setDescription('The Dealnest API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 8000, '::');
}
void bootstrap();
