import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PingService } from './ping.service';

@Injectable()
export class PingCron {
  private readonly logger = new Logger(PingCron.name);

  constructor(private readonly pingService: PingService) {}

  // Runs every 10 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handlePing() {
    this.logger.log('Running scheduled ping to keep API awake...');
    const result = await this.pingService.pingSelf();
    if (result.success) {
      this.logger.log(`Ping success: ${result.responseTime}ms`);
    } else {
      this.logger.warn(`Ping failed: ${result.error}`);
    }
  }
} 