// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      'http://localhost:3000',  // React frontend
      'http://localhost:3001',  // Alternative frontend port
      'https://your-yieldx-frontend.vercel.app', // Production frontend
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('YieldX Verification API')
    .setDescription(`
      Document verification API for YieldX Protocol - Tokenized African Trade Receivables.
      
      This API provides comprehensive document verification services including:
      • Sanctions screening against international watchlists
      • Fraud detection with pattern analysis  
      • Risk assessment and scoring
      • Analytics and reporting
      • Integration with Chainlink Functions
      
      Built for the Chainlink Hackathon 2025 🚀
    `)
    .setVersion('1.0.0')
    .addTag('verification', 'Document verification endpoints')
    .addTag('analytics', 'Analytics and reporting endpoints')
    .addTag('health', 'Health check and monitoring endpoints')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for authentication',
      },
      'api-key',
    )
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://yieldx.onrender.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'YieldX API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  await app.listen(port);

  // Self-ping every 15 minutes to keep the service alive (for Render free tier)
  const PING_URL = process.env.PING_URL || `http://localhost:${port}/ping`;
  setInterval(() => {
    axios.get(PING_URL)
      .then(() => console.log(`[Self-Ping] Pinged ${PING_URL} to keep service alive.`))
      .catch((err) => console.error('[Self-Ping] Ping failed:', err.message));
  }, 15 * 60 * 1000); // 15 minutes

  console.log('🚀 YieldX Verification API running on port', port);
  console.log(`📋 API Documentation: http://localhost:${port}/docs`);
  console.log(`🔍 Health Check: http://localhost:${port}/api/v1/health`);
  console.log(`📊 Environment: ${configService.get('NODE_ENV', 'development')}`);
  console.log('');
  console.log('🎯 Ready for Chainlink Functions integration!');
  console.log('💡 Test verification: POST /api/v1/verification/verify-documents');
  console.log('📈 View analytics: GET /api/v1/analytics/dashboard');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start YieldX API:', error);
  process.exit(1);
});
