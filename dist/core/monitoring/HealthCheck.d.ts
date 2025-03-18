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
export declare class HealthCheck {
    private mongoUri;
    private lastCheck;
    private checkInterval;
    constructor(mongoUri: string);
    start(intervalMs?: number): Promise<void>;
    stop(): void;
    check(): Promise<HealthStatus>;
    getLastCheck(): HealthStatus | null;
    isHealthy(): boolean;
}
