import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { observabilityConfig } from '../config';
import { AppLoggerService } from './logger.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private connection: Connection,
    private logger: AppLoggerService
  ) {}

  @Get()
  async check() {
    try {
      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      if (observabilityConfig.healthChecks.detailedChecks) {
        const dbStatus = await this.checkDatabase();
        
        return {
          ...status,
          details: {
            database: dbStatus,
            memory: this.getMemoryUsage(),
            uptime: process.uptime(),
          },
        };
      }

      return status;
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkDatabase(): Promise<{ status: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      await this.connection.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return { 
        status: 'ok',
        responseTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error.stack);
      return { status: 'error' };
    }
  }

  private getMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    return {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    };
  }
}
