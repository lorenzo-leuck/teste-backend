import { Module, Global, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppLoggerService } from './logger.service';
import { RequestTrackingMiddleware } from './request-tracking.middleware';
import { PerformanceInterceptor } from './performance.interceptor';
import { HealthController } from './health.controller';
import { observabilityConfig } from '../config';

@Global()
@Module({
  controllers: [
    ...(observabilityConfig.healthChecks.enabled ? [HealthController] : []),
  ],
  providers: [
    AppLoggerService,
    ...(observabilityConfig.performance.enabled ? [
      {
        provide: APP_INTERCEPTOR,
        useClass: PerformanceInterceptor,
      }
    ] : []),
  ],
  exports: [
    AppLoggerService,
  ],
})
export class ObservabilityModule {
  configure(consumer: MiddlewareConsumer) {
    if (observabilityConfig.requestTracking.enabled) {
      consumer
        .apply(RequestTrackingMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
  }
}
