import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedirectController } from './redirect.controller';
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
  controllers: [AppController, RedirectController],
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
        { path: 'mock/auth', method: RequestMethod.GET },
        { path: 'urls', method: RequestMethod.POST },
        { path: 'urls/byUser', method: RequestMethod.GET },
        { path: 'urls/:id', method: RequestMethod.PUT },
        { path: 'urls/:id', method: RequestMethod.DELETE }
      );
  }
}
