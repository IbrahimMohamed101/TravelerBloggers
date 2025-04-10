const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General rate limiter for all requests
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests, please try again later'
        });
    }
});

// Strict limiter for sensitive endpoints
const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Very strict limit for sensitive operations
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many attempts, please try again later'
        });
    }
});

module.exports = {
    globalLimiter,
    sensitiveLimiter
};
