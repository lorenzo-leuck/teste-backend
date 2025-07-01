export const observabilityConfig = {
  enabled: process.env.OBSERVABILITY_ENABLED === 'true',
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    console: true,
    file: process.env.LOG_TO_FILE === 'true',
    logFilePath: 'logs/application.log',
    datadog: {
      enabled: process.env.DATADOG_ENABLED === 'true',
      apiKey: process.env.DATADOG_API_KEY,
      host: process.env.DATADOG_HOST,
      service: process.env.DATADOG_SERVICE || 'url-shortener',
      tags: process.env.DATADOG_TAGS ? process.env.DATADOG_TAGS.split(',') : [],
    },
  },
  
  // Request tracking
  requestTracking: {
    enabled: process.env.TRACK_REQUESTS !== 'false',
    logBody: false,
    logHeaders: false,
  },
  
  // Performance monitoring
  performance: {
    enabled: process.env.MONITOR_PERFORMANCE === 'true',
    sampleRate: 0.1,
    slowRequestThreshold: 1000,
  },
  
  // Health checks
  healthChecks: {
    enabled: process.env.ENABLE_HEALTH_CHECKS !== 'false',
    detailedChecks: false,
  },
};
