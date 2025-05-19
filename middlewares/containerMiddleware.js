/**
 * Middleware to attach the container to the request object
 * This ensures that all services and database access are available in route handlers
 */
const container = require('../container/index');

module.exports = (req, res, next) => {
    req.container = container;
    next();
};
