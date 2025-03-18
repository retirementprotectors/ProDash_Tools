"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path_1 = require("path");
class MonitoringService extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = [];
        this.alerts = [];
        this.monitoringInterval = null;
        this.initialized = false;
        this.config = {
            enabled: true,
            alertThresholds: {
                contextCount: 1000, // Alert if more than 1000 contexts
                backupAgeHours: 24, // Alert if no backup in 24 hours
                errorCount: 5 // Alert if more than 5 errors
            },
            checkIntervalMs: 15 * 60 * 1000 // 15 minutes
        };
        this.metricsPath = (0, path_1.join)(process.cwd(), '.context-keeper', 'monitoring', 'metrics.json');
        this.alertsPath = (0, path_1.join)(process.cwd(), '.context-keeper', 'monitoring', 'alerts.json');
    }
    async initialize() {
        if (this.initialized)
            return;
        try {
            // Ensure directories exist
            const metricsDir = (0, path_1.dirname)(this.metricsPath);
            const alertsDir = (0, path_1.dirname)(this.alertsPath);
            if (!(0, fs_1.existsSync)(metricsDir)) {
                (0, fs_1.mkdirSync)(metricsDir, { recursive: true });
            }
            if (!(0, fs_1.existsSync)(alertsDir)) {
                (0, fs_1.mkdirSync)(alertsDir, { recursive: true });
            }
            await this.loadData();
            // Start monitoring if it's not already running
            if (!this.monitoringInterval && this.config.enabled) {
                this.startMonitoring();
            }
            this.initialized = true;
        }
        catch (error) {
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
    isInitialized() {
        return this.initialized;
    }
    // Get monitoring configuration
    getMonitoringConfig() {
        return { ...this.config };
    }
    // Update monitoring configuration
    setMonitoringConfig(config) {
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
    async loadData() {
        try {
            if ((0, fs_1.existsSync)(this.metricsPath)) {
                const metricsData = (0, fs_1.readFileSync)(this.metricsPath, 'utf8');
                this.metrics = JSON.parse(metricsData);
            }
            if ((0, fs_1.existsSync)(this.alertsPath)) {
                const alertsData = (0, fs_1.readFileSync)(this.alertsPath, 'utf8');
                this.alerts = JSON.parse(alertsData);
            }
        }
        catch (error) {
            console.error('Error loading monitoring data:', error);
        }
    }
    async saveData() {
        try {
            const metricsDir = (0, path_1.dirname)(this.metricsPath);
            if (!(0, fs_1.existsSync)(metricsDir)) {
                (0, fs_1.mkdirSync)(metricsDir, { recursive: true });
            }
            (0, fs_1.writeFileSync)(this.metricsPath, JSON.stringify(this.metrics, null, 2));
            const alertsDir = (0, path_1.dirname)(this.alertsPath);
            if (!(0, fs_1.existsSync)(alertsDir)) {
                (0, fs_1.mkdirSync)(alertsDir, { recursive: true });
            }
            (0, fs_1.writeFileSync)(this.alertsPath, JSON.stringify(this.alerts, null, 2));
        }
        catch (error) {
            console.error('Error saving monitoring data:', error);
        }
    }
    async addAlert(type, message, severity, metadata) {
        if (!this.initialized)
            await this.initialize();
        const alert = {
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
    async acknowledgeAlert(alertId) {
        if (!this.initialized)
            await this.initialize();
        const alertIndex = this.alerts.findIndex(a => a.id === alertId);
        if (alertIndex === -1) {
            return false;
        }
        this.alerts[alertIndex].acknowledged = true;
        await this.saveData();
        this.emit('alert-acknowledged', this.alerts[alertIndex]);
        return true;
    }
    async resolveAlert(alertId) {
        if (!this.initialized)
            await this.initialize();
        const alertIndex = this.alerts.findIndex(a => a.id === alertId);
        if (alertIndex === -1) {
            return false;
        }
        this.alerts[alertIndex].resolved = true;
        await this.saveData();
        this.emit('alert-resolved', this.alerts[alertIndex]);
        return true;
    }
    async getAlerts(includeResolved = false) {
        if (!this.initialized)
            await this.initialize();
        return includeResolved
            ? [...this.alerts]
            : this.alerts.filter(a => !a.resolved);
    }
    // Get all active (unresolved) alerts
    async getActiveAlerts() {
        return this.getAlerts(false);
    }
    async recordMetrics(metrics) {
        if (!this.initialized)
            await this.initialize();
        const newMetrics = {
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
    async getMetrics() {
        if (!this.initialized)
            await this.initialize();
        return [...this.metrics];
    }
    // Run a manual health check
    async runHealthCheck() {
        if (!this.initialized)
            await this.initialize();
        const issues = [];
        try {
            // Example health checks
            // 1. Check if we can access the metrics directory
            if (!(0, fs_1.existsSync)((0, path_1.dirname)(this.metricsPath))) {
                issues.push('Metrics directory is not accessible');
            }
            // 2. Check if we can access the alerts directory
            if (!(0, fs_1.existsSync)((0, path_1.dirname)(this.alertsPath))) {
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
            }
            catch (error) {
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
        }
        catch (error) {
            console.error('Health check failed:', error);
            issues.push(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                issues
            };
        }
    }
    startMonitoring() {
        // Schedule first check to happen after 10 seconds
        setTimeout(() => this.checkHealth(), 10000);
        // Set up regular interval for future checks
        this.monitoringInterval = setInterval(() => this.checkHealth(), this.config.checkIntervalMs);
        console.log(`Started health monitoring with interval of ${this.config.checkIntervalMs / (60 * 1000)} minutes`);
    }
    async checkHealth() {
        try {
            console.log('Checking system health...');
            // Get current memory usage
            const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
            // Record metrics (in a real app, you'd gather more comprehensive metrics)
            await this.recordMetrics({
                memoryUsage,
                cpuUsage: 0, // Would require more complex code to measure CPU usage
                contextCount: 0, // Would need to query the ContextManager
                backupCount: 0, // Would need to query the BackupManager
                lastBackupTime: 0 // Would need to query the BackupManager
            });
            // Check memory usage threshold (example)
            if (memoryUsage > 500) { // 500 MB threshold
                await this.addAlert('high_memory_usage', `High memory usage detected: ${memoryUsage.toFixed(2)} MB`, 'warning');
            }
            console.log('Health check completed');
        }
        catch (error) {
            console.error('Error during health check:', error);
        }
    }
}
exports.MonitoringService = MonitoringService;
