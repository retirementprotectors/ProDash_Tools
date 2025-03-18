import winston from 'winston';
declare const logger: winston.Logger;
declare const stream: {
    write: (message: string) => void;
};
export declare const logError: (error: Error, meta?: Record<string, unknown>) => void;
export declare const logInfo: (message: string, meta?: Record<string, unknown>) => void;
export declare const logWarn: (message: string, meta?: Record<string, unknown>) => void;
export declare const logDebug: (message: string, meta?: Record<string, unknown>) => void;
export { logger, stream, logError, logInfo, logWarn, logDebug, };
