const logger = require('../utils/logger');
const statusMessages = require('../constants/httpStatusMessages');

module.exports = (err, req, res, next) => {
    // Ensure we have a valid status code (must be a number between 100-599)
    let statusCode = err.statusCode || 500;
    if (!statusCode || statusCode < 100 || statusCode > 599) {
        statusCode = 500; // Default to 500 if invalid
    }

    const response = {
        status: 'error',
        statusCode,
        message: err.message || statusMessages[statusCode] || 'Something went wrong',
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.error = {
            name: err.name,
            ...err
        };
    } else {
        response.error = { name: err.name };
    }

    if (process.env.NODE_ENV !== 'test') {
        logger.error(err);
    }

    res.status(statusCode).json(response);
};
