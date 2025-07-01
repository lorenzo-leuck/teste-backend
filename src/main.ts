import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { appConfig } from './config';
import { AppLoggerService } from './observability';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Use custom logger
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Add global exception filter to prevent server crashes
  app.useGlobalFilters(new AllExceptionsFilter());
  
  app.setGlobalPrefix('api', {
    exclude: [
      { path: ':shortCode', method: RequestMethod.GET },
      { path: '', method: RequestMethod.GET }
    ],
  });
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription('API for shortening URLs')
    .setVersion('1.0')
    .addSecurityRequirements('JWT-auth')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token here',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
  // Custom Swagger setup options
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      authAction: {
        'JWT-auth': {
          name: 'JWT-auth',
          schema: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Please enter JWT token in the format: Bearer <token>'
          },
          value: 'Bearer '
        }
      }
    },
  };
  
  SwaggerModule.setup('api/docs', app, document, customOptions);
  
  await app.listen(appConfig.port, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Health check available at: ${await app.getUrl()}/api/health`);
  logger.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();
