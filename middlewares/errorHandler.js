const logger = require('../utils/logger');
const statusMessages = require('../constants/httpStatusMessages');

module.exports = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

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
