module.exports = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    const response = {
        status: 'error',
        statusCode,
        message: err.message || 'Server error'
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.error = {
            name: err.name,
            ...err
        };
    }

    res.status(statusCode).json(response);
};
