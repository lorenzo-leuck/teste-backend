import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from './logger.service';
import { observabilityConfig } from '../config';

@Injectable()
export class RequestTrackingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!observabilityConfig.requestTracking.enabled) {
      return next();
    }

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    
    // Log request start
    this.logger.debug(`Request started: ${method} ${originalUrl} from ${ip}`);
    
    // Log headers if enabled
    if (observabilityConfig.requestTracking.logHeaders) {
      this.logger.debug(`Request headers: ${JSON.stringify(req.headers)}`, 'RequestTracking');
    }
    
    // Log body if enabled
    if (observabilityConfig.requestTracking.logBody && req.body) {
      this.logger.debug(`Request body: ${JSON.stringify(req.body)}`, 'RequestTracking');
    }

    // Track response
    const originalSend = res.send;
    res.send = function(body) {
      const responseTime = Date.now() - startTime;
      const contentLength = body ? body.length : 0;
      
      // Log slow requests if performance monitoring is enabled
      if (
        observabilityConfig.performance.enabled && 
        responseTime > observabilityConfig.performance.slowRequestThreshold
      ) {
        this.logger.warn(
          `Slow request detected: ${method} ${originalUrl} took ${responseTime}ms`,
          'Performance'
        );
      }
      
      res.send = originalSend;
      return originalSend.call(this, body);
    };

    // Log when response is finished
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      this.logger.debug(
        `Request completed: ${method} ${originalUrl} - Status: ${res.statusCode} - ${responseTime}ms`,
        'RequestTracking'
      );
    });

    next();
  }
}
