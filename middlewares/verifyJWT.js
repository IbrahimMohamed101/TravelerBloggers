const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token and optionally check user role
 * @param {string|string[]} requiredRole - The role(s) required to access the route (optional)
 * @returns {Function} - Express middleware function
 */
const verifyJWT = (requiredRole = null) => {
    return async (req, res, next) => {
        try {
            // Step 1: Get the token from the Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                logger.warn('No token provided in request', {
                    method: req.method,
                    url: req.originalUrl,
                    ip: req.ip,
                });
                return res.status(401).json({ message: 'No token provided' });
            }

            const token = authHeader.split(' ')[1]; // Extract the token after "Bearer"

            // Step 2: Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            logger.info('Token verified successfully', {
                userId: decoded.id,
                email: decoded.email,
                role: decoded.role,
            });

            // Step 3: Attach user info to the request object
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };

            // Step 4: Check if the user has the required role (if specified)
            if (requiredRole) {
                const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
                if (!roles.includes(decoded.role)) {
                    logger.warn('User does not have the required role', {
                        userId: decoded.id,
                        email: decoded.email,
                        role: decoded.role,
                        requiredRole: roles,
                    });
                    return res.status(403).json({ message: 'Insufficient permissions' });
                }
            }

            // Step 5: Proceed to the next middleware/route handler
            next();
        } catch (error) {
            // Step 6: Handle different types of JWT errors
            if (error.name === 'TokenExpiredError') {
                logger.error('Token expired', {
                    error: error.message,
                    expiredAt: error.expiredAt,
                    ip: req.ip,
                });
                return res.status(401).json({ message: 'Token expired' });
            } else if (error.name === 'JsonWebTokenError') {
                logger.error('Invalid token', {
                    error: error.message,
                    ip: req.ip,
                });
                return res.status(401).json({ message: 'Invalid token' });
            }

            // Step 7: Handle unexpected errors
            logger.error('Error verifying token', {
                error: error.message,
                ip: req.ip,
            });
            return res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = verifyJWT;