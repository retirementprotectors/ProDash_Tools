import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors';
import { logWarning } from '../utils/logger';

// Create a limiter for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    const error = new RateLimitError('Rate limit exceeded');
    logWarning('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      status: 'error',
      message: error.message,
    });
  },
});

// Create a stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  handler: (req, res) => {
    const error = new RateLimitError('Authentication rate limit exceeded');
    logWarning('Authentication rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      status: 'error',
      message: error.message,
    });
  },
});

// Create a limiter for context creation/update endpoints
export const contextLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 context operations per minute
  message: 'Too many context operations, please try again later.',
  handler: (req, res) => {
    const error = new RateLimitError('Context operation rate limit exceeded');
    logWarning('Context operation rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      status: 'error',
      message: error.message,
    });
  },
}); 