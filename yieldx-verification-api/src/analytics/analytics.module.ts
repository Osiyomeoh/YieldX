// src/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { VerificationRecord, VerificationRecordSchema } from '../verification/schemas/verification-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VerificationRecord.name, schema: VerificationRecordSchema }
    ]),
    CacheModule.register({
      ttl: 300000, // 5 minutes cache
      max: 100,    // Maximum number of items in cache
    }),
    ThrottlerModule.forRoot({
      ttl: 60,  // 60 seconds (in seconds, not ms)
      limit: 10,   // 10 requests per minute
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}