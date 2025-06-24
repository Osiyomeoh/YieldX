import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PingController } from './ping.controller';

@Module({
  providers: [HealthService],
  controllers: [HealthController, PingController]
})
export class HealthModule {}
