import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  async pingSelf(): Promise<any> {
    const apiUrl = 'http://localhost:3000/ping'; // Adjust if running on a different port or behind a proxy
    try {
      const startTime = Date.now();
      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NestPing-Internal/1.0'
        },
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      return {
        success: true,
        status: response.status,
        responseTime,
        data: response.data
      };
    } catch (error: any) {
      this.logger.error(`Ping failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0
      };
    }
  }
} 