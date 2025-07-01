import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { ObservabilityModule } from './observability';
import { MockModule } from './modules/mock/mock.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthMiddleware } from './modules/auth/auth.middleware';
import { UrlModule } from './modules/url/url.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      cache: true,
    }),
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
        { path: 'mock/auth', method: RequestMethod.GET },
        { path: 'urls', method: RequestMethod.POST },
        { path: 'urls/:id', method: RequestMethod.PUT },
        { path: 'urls/:id', method: RequestMethod.DELETE }
      );
  }
}
