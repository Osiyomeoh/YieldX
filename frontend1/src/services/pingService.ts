// src/services/pingService.ts
class PingService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private apiUrl: string;

  constructor(apiUrl: string = 'https://yieldx.onrender.com') {
    this.apiUrl = apiUrl;
  }

  async ping() {
    try {
      const startTime = Date.now();
      
      // Try the main health check endpoint first
      const healthResponse = await fetch(`${this.apiUrl}/verification`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'YieldX-PingService/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const healthData = await healthResponse.json();
      const responseTime = Date.now() - startTime;

      if (healthResponse.ok) {
        return {
          success: true,
          timestamp: new Date().toISOString(),
          data: healthData,
          status: healthResponse.status,
          responseTime,
          endpoint: '/verification'
        };
      } else {
        throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }
    } catch (error: any) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error',
        status: error.status || 0
      };
    }
  }

  async testChainlinkEndpoint() {
    try {
      const testData = {
        invoiceId: 'PING-TEST-' + Date.now(),
        documentHash: '0x' + Math.random().toString(36).substring(2),
        commodity: 'Test Commodity',
        amount: '50000',
        supplierCountry: 'Kenya',
        buyerCountry: 'USA',
        exporterName: 'Test Exporter',
        buyerName: 'Test Buyer'
      };

      const response = await fetch(`${this.apiUrl}/verification/chainlink-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'YieldX-PingService/1.0'
        },
        body: JSON.stringify(testData),
        signal: AbortSignal.timeout(15000) // 15 second timeout for verification
      });

      const data = await response.json();

      return {
        success: response.ok,
        timestamp: new Date().toISOString(),
        data,
        status: response.status,
        endpoint: '/verification/chainlink-verify'
      };
    } catch (error: any) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Chainlink verification test failed',
        status: error.status || 0,
        endpoint: '/verification/chainlink-verify'
      };
    }
  }

  async testQuickEndpoint() {
    try {
      const response = await fetch(`${this.apiUrl}/verification/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'YieldX-PingService/1.0'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const data = await response.json();

      return {
        success: response.ok,
        timestamp: new Date().toISOString(),
        data,
        status: response.status,
        endpoint: '/verification/test'
      };
    } catch (error: any) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Quick test failed',
        status: error.status || 0,
        endpoint: '/verification/test'
      };
    }
  }

  startCronJob(intervalMinutes: number = 10) {
    if (this.isRunning) {
      throw new Error('Ping service is already running');
    }

    this.isRunning = true;
    
    // Initial ping
    this.ping();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.ping();
    }, intervalMinutes * 60 * 1000);

    console.log(`Ping service started with ${intervalMinutes} minute interval`);
  }

  stopCronJob() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Ping service stopped');
  }

  isActive() {
    return this.isRunning;
  }

  async manualPing() {
    return this.ping();
  }

  async runFullHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      health: await this.ping(),
      quickTest: await this.testQuickEndpoint(),
      chainlinkTest: await this.testChainlinkEndpoint()
    };

    return results;
  }

  getApiUrl() {
    return this.apiUrl;
  }

  setApiUrl(newUrl: string) {
    this.apiUrl = newUrl;
  }
}

// Export singleton instance
const pingService = new PingService();
export default pingService; 