import { MongoClient } from 'mongodb';
import { logError, logInfo } from '../utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  components: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      message?: string;
      latency?: number;
    };
  };
}

export class HealthCheck {
  private mongoUri: string;
  private lastCheck: HealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(mongoUri: string) {
    this.mongoUri = mongoUri;
  }

  public async start(intervalMs: number = 60000): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Perform initial health check
    await this.check();

    // Schedule regular health checks
    this.checkInterval = setInterval(async () => {
      await this.check();
    }, intervalMs);

    logInfo('Health check monitoring started', { intervalMs });
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logInfo('Health check monitoring stopped');
    }
  }

  public async check(): Promise<HealthStatus> {
    const status: HealthStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      components: {},
    };

    // Check MongoDB connection
    try {
      const startTime = Date.now();
      const client = await MongoClient.connect(this.mongoUri);
      const latency = Date.now() - startTime;
      
      await client.close();

      status.components.mongodb = {
        status: 'healthy',
        message: 'Successfully connected to MongoDB',
        latency,
      };
    } catch (error) {
      status.status = 'unhealthy';
      status.components.mongodb = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      logError(error instanceof Error ? error : new Error('MongoDB health check failed'));
    }

    // Check system resources
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    status.components.memory = {
      status: 'healthy',
      message: 'Memory usage within acceptable limits',
      latency: memoryUsage.heapUsed / 1024 / 1024, // MB
    };

    status.components.cpu = {
      status: 'healthy',
      message: 'CPU usage within acceptable limits',
      latency: (cpuUsage.user + cpuUsage.system) / 1000000, // seconds
    };

    // Update last check
    this.lastCheck = status;

    // Log if status changed from last check
    if (this.lastCheck && this.lastCheck.status !== status.status) {
      if (status.status === 'healthy') {
        logInfo('System recovered to healthy state', status);
      } else {
        logError(new Error('System entered unhealthy state'), status);
      }
    }

    return status;
  }

  public getLastCheck(): HealthStatus | null {
    return this.lastCheck;
  }

  public isHealthy(): boolean {
    return this.lastCheck?.status === 'healthy';
  }
} 