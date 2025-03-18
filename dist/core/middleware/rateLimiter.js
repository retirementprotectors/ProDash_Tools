"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
// Create a limiter for general API endpoints
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res) => {
        const error = new errors_1.RateLimitError('Rate limit exceeded');
        (0, logger_1.logWarning)('Rate limit exceeded', {
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
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    handler: (req, res) => {
        const error = new errors_1.RateLimitError('Authentication rate limit exceeded');
        (0, logger_1.logWarning)('Authentication rate limit exceeded', {
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
exports.contextLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 context operations per minute
    message: 'Too many context operations, please try again later.',
    handler: (req, res) => {
        const error = new errors_1.RateLimitError('Context operation rate limit exceeded');
        (0, logger_1.logWarning)('Context operation rate limit exceeded', {
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
