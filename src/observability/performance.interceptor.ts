import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from './logger.service';
import { observabilityConfig } from '../config';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!observabilityConfig.performance.enabled) {
      return next.handle();
    }

    // Only sample a percentage of requests based on configuration
    if (Math.random() > observabilityConfig.performance.sampleRate) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    
    const start = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        
        this.logger.debug(
          `[Performance] ${method} ${url} - ${className}.${handlerName} - ${duration}ms`,
          'Performance'
        );
        
        // Track memory usage periodically
        if (duration > observabilityConfig.performance.slowRequestThreshold) {
          const memoryUsage = process.memoryUsage();
          this.logger.debug(
            `[Memory] RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, ` +
            `Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}/${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            'Performance'
          );
        }
      }),
    );
  }
}
