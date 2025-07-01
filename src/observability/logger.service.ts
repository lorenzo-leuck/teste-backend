import { Injectable, LoggerService } from '@nestjs/common';
import { observabilityConfig } from '../config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';
// Import conditionally to avoid errors if the package is not installed
let DatadogWinston: any;
try {
  DatadogWinston = require('datadog-winston');
} catch (e) {
  // Datadog Winston transport not available
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const { level, console: enableConsole, file: enableFile, logFilePath } = observabilityConfig.logging;
    
    // Create logs directory if file logging is enabled
    if (enableFile) {
      const logDir = path.dirname(logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }

    // Configure transports
    const transports: winston.transport[] = [];
    
    // Console transport
    if (enableConsole) {
      transports.push(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}`;
          }),
        ),
      }));
    }
    
    // File transport with rotation
    if (enableFile) {
      transports.push(new winston.transports.DailyRotateFile({
        filename: logFilePath,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }));
    }
    
    // Datadog transport
    const { datadog } = observabilityConfig.logging;
    if (datadog?.enabled && datadog?.apiKey && DatadogWinston) {
      transports.push(new DatadogWinston({
        apiKey: datadog.apiKey,
        hostname: datadog.host,
        service: datadog.service,
        ddsource: 'nodejs',
        ddtags: datadog.tags?.join(','),
      }));
    }

    // Create logger
    this.logger = winston.createLogger({
      level,
      levels: winston.config.npm.levels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports,
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(`${message}${trace ? `\n${trace}` : ''}`, { context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
