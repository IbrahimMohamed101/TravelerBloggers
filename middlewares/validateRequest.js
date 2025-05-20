const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors/CustomErrors');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError(errors.array()[0].msg);
    }
    next();
};

module.exports = validateRequest;
