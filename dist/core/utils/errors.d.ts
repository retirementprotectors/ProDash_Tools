export declare class BaseError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class NotFoundError extends Error {
    constructor(message: string);
}
export declare class AuthenticationError extends Error {
    constructor(message: string);
}
export declare class AuthorizationError extends Error {
    constructor(message: string);
}
export declare class ConfigurationError extends Error {
    constructor(message: string);
}
export declare class NetworkError extends Error {
    constructor(message: string);
}
export declare class ServiceError extends Error {
    constructor(message: string);
}
export declare class DatabaseError extends Error {
    constructor(message: string);
}
export declare class ExternalServiceError extends BaseError {
    constructor(message: string);
}
export declare class RateLimitError extends BaseError {
    constructor(message: string);
}
export declare const errorHandler: (err: Error, req: any, res: any, next: any) => any;
export declare const asyncHandler: (fn: Function) => (req: any, res: any, next: any) => void;
