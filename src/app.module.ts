import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedirectMiddleware } from './middleware/redirect.middleware';
import { databaseConfig } from './config/database.config';
import { ObservabilityModule } from './observability';
import { MockModule } from './modules/mock/mock.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthMiddleware } from './modules/auth/auth.middleware';
import { UrlModule } from './modules/url/url.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    ObservabilityModule,
    MockModule,
    AuthModule,
    UrlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply auth middleware only to specific protected routes
    // This approach is more reliable than using exclude with a global prefix
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        // Protected routes that require authentication
        { path: 'api/urls', method: RequestMethod.POST },
        { path: 'api/urls/byUser', method: RequestMethod.GET },
      );
    
    // Apply redirect middleware to all routes
    consumer
      .apply(RedirectMiddleware)
      .forRoutes('*');
  }
}
