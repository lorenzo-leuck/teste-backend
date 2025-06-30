import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
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
  
  await app.listen(appConfig.port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Health check available at: ${await app.getUrl()}/api/health`);
}
bootstrap();
