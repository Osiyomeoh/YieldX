import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { VerificationModule } from './verification/verification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        dbName: configService.get<string>('database.name'),
        retryWrites: true,
        w: 'majority',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('throttle.ttl') || 60, // fallback to 60s if not set
        limit: configService.get('throttle.limit') || 10,
      }),
      inject: [ConfigService],
    }),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
      max: 100, // maximum number of items in cache
    }),

    // Feature modules
    DatabaseModule,
    VerificationModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}