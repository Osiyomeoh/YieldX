export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    name: process.env.DB_NAME || 'yieldx_verification',
  },
  
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    version: '1.0.0',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  },
  
  verification: {
    timeout: parseInt(process.env.VERIFICATION_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300000', 10), // 5 minutes
  },
  
  external: {
    sanctionsApiUrl: process.env.SANCTIONS_API_URL || 'https://api.sanctions-check.com',
    sanctionsApiKey: process.env.SANCTIONS_API_KEY,
    fraudApiUrl: process.env.FRAUD_API_URL || 'https://api.fraud-detection.com',
    fraudApiKey: process.env.FRAUD_API_KEY,
  },
  
  security: {
    apiKey: process.env.API_KEY,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  },
  
  chainlink: {
    functionsUrl: process.env.CHAINLINK_FUNCTIONS_URL,
    apiKey: process.env.CHAINLINK_API_KEY,
  },
  
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  },
});
