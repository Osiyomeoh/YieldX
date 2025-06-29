import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PingController } from './ping.controller';
import { PingService } from './ping.service';
import { PingCron } from './ping.cron';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [HealthService, PingService, PingCron],
  controllers: [HealthController, PingController]
})
export class HealthModule {}
