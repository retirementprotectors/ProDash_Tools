"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.RateLimitError = exports.ExternalServiceError = exports.DatabaseError = exports.ServiceError = exports.NetworkError = exports.ConfigurationError = exports.AuthorizationError = exports.AuthenticationError = exports.NotFoundError = exports.ValidationError = exports.BaseError = void 0;
const logger_1 = require("./logger");
class BaseError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BaseError = BaseError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class ConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class ServiceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServiceError';
    }
}
exports.ServiceError = ServiceError;
class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends BaseError {
    constructor(message) {
        super(message, 502);
        this.name = 'ExternalServiceError';
    }
}
exports.ExternalServiceError = ExternalServiceError;
class RateLimitError extends BaseError {
    constructor(message) {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
// Error handler middleware for Express
const errorHandler = (err, req, res, next) => {
    if (err instanceof BaseError) {
        (0, logger_1.logError)(err, {
            path: req.path,
            method: req.method,
            query: req.query,
            body: req.body,
        });
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
        });
    }
    // Handle unknown errors
    (0, logger_1.logError)(err, {
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
    });
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
};
exports.errorHandler = errorHandler;
// Async handler wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
