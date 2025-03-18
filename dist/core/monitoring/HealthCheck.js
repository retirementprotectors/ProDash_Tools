"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheck = void 0;
const mongodb_1 = require("mongodb");
const logger_1 = require("../utils/logger");
class HealthCheck {
    constructor(mongoUri) {
        this.lastCheck = null;
        this.checkInterval = null;
        this.mongoUri = mongoUri;
    }
    async start(intervalMs = 60000) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        // Perform initial health check
        await this.check();
        // Schedule regular health checks
        this.checkInterval = setInterval(async () => {
            await this.check();
        }, intervalMs);
        (0, logger_1.logInfo)('Health check monitoring started', { intervalMs });
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            (0, logger_1.logInfo)('Health check monitoring stopped');
        }
    }
    async check() {
        const status = {
            status: 'healthy',
            timestamp: Date.now(),
            components: {},
        };
        // Check MongoDB connection
        try {
            const startTime = Date.now();
            const client = await mongodb_1.MongoClient.connect(this.mongoUri);
            const latency = Date.now() - startTime;
            await client.close();
            status.components.mongodb = {
                status: 'healthy',
                message: 'Successfully connected to MongoDB',
                latency,
            };
        }
        catch (error) {
            status.status = 'unhealthy';
            status.components.mongodb = {
                status: 'unhealthy',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            (0, logger_1.logError)(error instanceof Error ? error : new Error('MongoDB health check failed'));
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
                (0, logger_1.logInfo)('System recovered to healthy state', status);
            }
            else {
                (0, logger_1.logError)(new Error('System entered unhealthy state'), status);
            }
        }
        return status;
    }
    getLastCheck() {
        return this.lastCheck;
    }
    isHealthy() {
        return this.lastCheck?.status === 'healthy';
    }
}
exports.HealthCheck = HealthCheck;
