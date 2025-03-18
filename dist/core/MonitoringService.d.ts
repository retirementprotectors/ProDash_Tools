import { EventEmitter } from 'events';
interface HealthMetrics {
    memoryUsage: number;
    cpuUsage: number;
    contextCount: number;
    backupCount: number;
    lastBackupTime: number;
    timestamp: number;
}
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
interface MonitoringConfig {
    enabled: boolean;
    alertThresholds: {
        contextCount: number;
        backupAgeHours: number;
        errorCount: number;
    };
    checkIntervalMs: number;
}
export declare class MonitoringService extends EventEmitter {
    private metricsPath;
    private alertsPath;
    private metrics;
    private alerts;
    private monitoringInterval;
    private initialized;
    private config;
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getMonitoringConfig(): MonitoringConfig;
    setMonitoringConfig(config: Partial<MonitoringConfig>): void;
    private loadData;
    private saveData;
    addAlert(type: string, message: string, severity: 'info' | 'warning' | 'error' | 'critical', metadata?: Record<string, any>): Promise<Alert>;
    acknowledgeAlert(alertId: string): Promise<boolean>;
    resolveAlert(alertId: string): Promise<boolean>;
    getAlerts(includeResolved?: boolean): Promise<Alert[]>;
    getActiveAlerts(): Promise<Alert[]>;
    recordMetrics(metrics: Omit<HealthMetrics, 'timestamp'>): Promise<HealthMetrics>;
    getMetrics(): Promise<HealthMetrics[]>;
    runHealthCheck(): Promise<{
        success: boolean;
        issues: string[];
    }>;
    private startMonitoring;
    private checkHealth;
}
export {};
