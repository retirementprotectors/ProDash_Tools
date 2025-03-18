import { logError } from './logger';

export class BaseError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends BaseError {
  constructor(message: string) {
    super(message, 502);
    this.name = 'ExternalServiceError';
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Error handler middleware for Express
export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  if (err instanceof BaseError) {
    logError(err, { 
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
  logError(err, {
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

// Async handler wrapper to catch errors
export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 