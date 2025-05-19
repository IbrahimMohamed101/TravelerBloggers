class BaseError extends Error {
    constructor(message, name, statusCode) {
        super(message);
        this.name = name || 'Error';
        this.statusCode = statusCode || 500;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ConflictError extends BaseError {
    constructor(message = 'Conflict') {
        super(message, 'ConflictError', 409);
    }
}

class ValidationError extends BaseError {
    constructor(message = 'Validation Error') {
        super(message, 'ValidationError', 400);
    }
}

class UnauthorizedError extends BaseError {
    constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
        super(message, 'UnauthorizedError', 401);
        this.code = code;
        this.details = details;
    }
}

class ForbiddenError extends BaseError {
    constructor(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
        super(message, 'ForbiddenError', 403);
        this.code = code;
        this.details = details;
    }
}

class NotFoundError extends BaseError {
    constructor(message = 'Not Found') {
        super(message, 'NotFoundError', 404);
    }
}

class InternalServerError extends BaseError {
    constructor(message = 'Internal Server Error') {
        super(message, 'InternalServerError', 500);
    }
}

class BadRequestError extends BaseError {
    constructor(message = 'Bad Request') {
        super(message, 'BadRequestError', 400);
    }
}

module.exports = {
    BaseError,
    ConflictError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    InternalServerError,
    BadRequestError
};
