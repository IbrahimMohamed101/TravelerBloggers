const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT and optionally validate role(s)
 * @param {string|string[]=} requiredRole - Role or array of roles allowed to access the route
 */
const verifyJWT = (requiredRole = null) => {
    return async (req, res, next) => {
        logger.info(`verifyJWT - ${req.method} ${req.originalUrl}`);

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                logger.warn('Missing or malformed Authorization header');
                return res.status(401).json({ message: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = {
                id: decoded.userId || decoded.id,
                email: decoded.email,
                role: decoded.role,
                sessionId: decoded.sessionId,
            };

            if (requiredRole) {
                const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
                if (!roles.includes(req.user.role)) {
                    logger.warn(`Access denied - role "${req.user.role}" not in [${roles}]`);
                    return res.status(403).json({ message: 'Insufficient permissions' });
                }
            }

            next();
        } catch (error) {
            const logMeta = { ip: req.ip, message: error.message };
            switch (error.name) {
                case 'TokenExpiredError':
                    logger.warn('Token expired', { ...logMeta, expiredAt: error.expiredAt });
                    return res.status(401).json({ message: 'Token expired' });
                case 'JsonWebTokenError':
                    logger.warn('Invalid token', logMeta);
                    return res.status(401).json({ message: 'Invalid token' });
                default:
                    logger.error('JWT verification failed', { ...logMeta, stack: error.stack });
                    return res.status(500).json({ message: 'Server error' });
            }
        }
    };
};

module.exports = verifyJWT;
