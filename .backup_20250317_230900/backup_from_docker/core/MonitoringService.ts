import { EventEmitter } from 'events';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { ContextManager } from './ContextManager';
import { BackupManager } from './BackupManager';

// Unified type for metrics
interface Metric {
  name: string;
  value: number | string | boolean;
  timestamp: number;
}

// System health metrics
interface HealthMetrics {
  memoryUsage: number;
  cpuUsage: number;
  contextCount: number;
  backupCount: number;
  lastBackupTime: number;
  timestamp: number;
}

// Alert type
interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
  metadata?: Record<string, any>;
}

// Configuration for monitoring thresholds and behavior
interface MonitoringConfig {
  enabled: boolean;
  alertThresholds: {
    contextCount: number;
    backupAgeHours: number;
    errorCount: number;
  };
  checkIntervalMs: number;
}

export class MonitoringService extends EventEmitter {
  private metricsPath: string;
  private alertsPath: string;
  private metrics: HealthMetrics[] = [];
  private alerts: Alert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private config: MonitoringConfig = {
    enabled: true,
    alertThresholds: {
      contextCount: 1000,  // Alert if more than 1000 contexts
      backupAgeHours: 24,  // Alert if no backup in 24 hours
      errorCount: 5        // Alert if more than 5 errors
    },
    checkIntervalMs: 15 * 60 * 1000 // 15 minutes
  };
  private contextManager: ContextManager;
  private backupManager: BackupManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(contextManager: ContextManager, backupManager: BackupManager) {
    super();
    this.metricsPath = join(process.cwd(), '.context-keeper', 'monitoring', 'metrics.json');
    this.alertsPath = join(process.cwd(), '.context-keeper', 'monitoring', 'alerts.json');
    this.contextManager = contextManager;
    this.backupManager = backupManager;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Ensure directories exist
      const metricsDir = dirname(this.metricsPath);
      const alertsDir = dirname(this.alertsPath);
      
      if (!existsSync(metricsDir)) {
        mkdirSync(metricsDir, { recursive: true });
      }
      
      if (!existsSync(alertsDir)) {
        mkdirSync(alertsDir, { recursive: true });
      }
      
      await this.loadData();
      
      // Start monitoring if it's not already running
      if (!this.monitoringInterval && this.config.enabled) {
        this.startMonitoring();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
    }
  }

  async shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Get the monitoring service initialization state
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // Get monitoring configuration
  getMonitoringConfig(): MonitoringConfig {
    return { ...this.config };
  }
  
  // Update monitoring configuration
  setMonitoringConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update monitoring interval if it's running
    if (this.initialized) {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      
      if (this.config.enabled) {
        this.startMonitoring();
      }
    }
  }

  private async loadData() {
    try {
      if (existsSync(this.metricsPath)) {
        const metricsData = readFileSync(this.metricsPath, 'utf8');
        this.metrics = JSON.parse(metricsData);
      }
      
      if (existsSync(this.alertsPath)) {
        const alertsData = readFileSync(this.alertsPath, 'utf8');
        this.alerts = JSON.parse(alertsData);
      }
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    }
  }

  private async saveData() {
    try {
      const metricsDir = dirname(this.metricsPath);
      if (!existsSync(metricsDir)) {
        mkdirSync(metricsDir, { recursive: true });
      }
      writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
      
      const alertsDir = dirname(this.alertsPath);
      if (!existsSync(alertsDir)) {
        mkdirSync(alertsDir, { recursive: true });
      }
      writeFileSync(this.alertsPath, JSON.stringify(this.alerts, null, 2));
    } catch (error) {
      console.error('Error saving monitoring data:', error);
    }
  }

  async addAlert(type: string, message: string, severity: 'info' | 'warning' | 'error' | 'critical', metadata?: Record<string, any>) {
    if (!this.initialized) await this.initialize();
    
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      metadata
    };
    
    this.alerts.push(alert);
    await this.saveData();
    
    this.emit('alert', alert);
    
    return alert;
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();
    
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) {
      return false;
    }
    
    this.alerts[alertIndex].acknowledged = true;
    await this.saveData();
    
    this.emit('alert-acknowledged', this.alerts[alertIndex]);
    
    return true;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();
    
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) {
      return false;
    }
    
    this.alerts[alertIndex].resolved = true;
    await this.saveData();
    
    this.emit('alert-resolved', this.alerts[alertIndex]);
    
    return true;
  }

  async getAlerts(includeResolved: boolean = false): Promise<Alert[]> {
    if (!this.initialized) await this.initialize();
    
    return includeResolved 
      ? [...this.alerts]
      : this.alerts.filter(a => !a.resolved);
  }
  
  // Get all active (unresolved) alerts
  async getActiveAlerts(): Promise<Alert[]> {
    return this.getAlerts(false);
  }

  async recordMetrics(metrics: Omit<HealthMetrics, 'timestamp'>): Promise<HealthMetrics> {
    if (!this.initialized) await this.initialize();
    
    const newMetrics: HealthMetrics = {
      ...metrics,
      timestamp: Date.now()
    };
    
    this.metrics.push(newMetrics);
    
    // Keep only the last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    await this.saveData();
    
    return newMetrics;
  }

  async getMetrics(): Promise<HealthMetrics[]> {
    if (!this.initialized) await this.initialize();
    
    return [...this.metrics];
  }
  
  // Run a manual health check
  async runHealthCheck(): Promise<{ success: boolean; issues: string[] }> {
    if (!this.initialized) await this.initialize();
    
    const issues: string[] = [];
    
    try {
      // Example health checks
      // 1. Check if we can access the metrics directory
      if (!existsSync(dirname(this.metricsPath))) {
        issues.push('Metrics directory is not accessible');
      }
      
      // 2. Check if we can access the alerts directory
      if (!existsSync(dirname(this.alertsPath))) {
        issues.push('Alerts directory is not accessible');
      }
      
      // 3. Record a test metric to verify write access
      try {
        await this.recordMetrics({
          memoryUsage: 0,
          cpuUsage: 0,
          contextCount: 0,
          backupCount: 0,
          lastBackupTime: Date.now()
        });
      } catch (error) {
        issues.push('Failed to write test metric');
      }
      
      // Add any active alerts as issues
      const activeAlerts = await this.getActiveAlerts();
      activeAlerts.forEach(alert => {
        issues.push(`Active alert: ${alert.message}`);
      });
      
      return {
        success: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Health check failed:', error);
      issues.push(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        issues
      };
    }
  }

  private startMonitoring() {
    // Schedule first check to happen after 10 seconds
    setTimeout(() => this.checkHealth(), 10000);
    
    // Set up regular interval for future checks
    this.monitoringInterval = setInterval(
      () => this.checkHealth(),
      this.config.checkIntervalMs
    );
    
    console.log(`Started health monitoring with interval of ${this.config.checkIntervalMs / (60 * 1000)} minutes`);
  }

  private async checkHealth() {
    try {
      console.log('Checking system health...');
      
      // Get current memory usage
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      
      // Record metrics (in a real app, you'd gather more comprehensive metrics)
      await this.recordMetrics({
        memoryUsage,
        cpuUsage: 0, // Would require more complex code to measure CPU usage
        contextCount: 0, // Would need to query the ContextManager
        backupCount: 0,  // Would need to query the BackupManager
        lastBackupTime: 0 // Would need to query the BackupManager
      });
      
      // Check memory usage threshold (example)
      if (memoryUsage > 500) { // 500 MB threshold
        await this.addAlert(
          'high_memory_usage',
          `High memory usage detected: ${memoryUsage.toFixed(2)} MB`,
          'warning'
        );
      }
      
      console.log('Health check completed');
    } catch (error) {
      console.error('Error during health check:', error);
    }
  }

  init() {
    // Start health monitoring
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, 15 * 60 * 1000); // Check every 15 minutes

    // Do an initial health check
    this.checkHealth();
  }

  getHealth() {
    return {
      status: 'healthy',
      services: {
        contextManager: 'online',
        backupManager: 'online',
        monitoringService: 'online'
      },
      alerts: this.alerts,
      timestamp: new Date().toISOString()
    };
  }

  addAlert(alert: Alert) {
    this.alerts.push(alert);
    this.emit('alert', alert);
  }

  clearAlerts() {
    this.alerts = [];
    this.emit('alerts-cleared');
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
} 