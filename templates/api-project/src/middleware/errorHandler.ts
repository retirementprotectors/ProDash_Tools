import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ApiError) {
    logger.warn('API Error:', {
      statusCode: err.statusCode,
      message: err.message,
      details: err.details
    });

    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  // Log unexpected errors
  logger.error('Unexpected Error:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Don't expose internal errors to clients
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.headers['x-request-id']
  });
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: 'Resource not found',
    },
  });
}; 