import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult, ValidationError } from 'express-validator';
import { ApiError } from './errorHandler';

export const validateResults = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new ApiError(400, 'Validation Error', errors.array());
    next(error);
    return;
  }
  next();
};

export const validateContext = [
  body('content').exists().withMessage('Content is required'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  validateResults,
];

export const validateId = [
  param('id').isString().notEmpty().withMessage('Valid ID is required'),
  validateResults,
];

export const validateSearch = [
  body('query').optional().isString().withMessage('Query must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('dateRange').optional().isObject().withMessage('Date range must be an object'),
  body('dateRange.start').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  body('dateRange.end').optional().isISO8601().withMessage('End date must be valid ISO date'),
  validateResults,
];

export const validateBatchOperation = [
  body().isArray().withMessage('Request body must be an array'),
  body('*.content').exists().withMessage('Content is required for all items'),
  body('*.metadata').optional().isObject().withMessage('Metadata must be an object'),
  validateResults,
]; 