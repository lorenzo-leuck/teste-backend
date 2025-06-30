import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { appConfig } from './config';
import { AppLoggerService } from './observability';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Use custom logger
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.setGlobalPrefix('api');
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription('API for shortening URLs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(appConfig.port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Health check available at: ${await app.getUrl()}/api/health`);
  logger.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();
