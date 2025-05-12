const express = require('express');
const router = express.Router();
const { sensitiveLimiter } = require('../../middlewares/rateLimiter');
const { validateRegister, validate } = require('../../validators/validate');
const Joi = require('joi');

module.exports = (container) => {
    const authController = container.getController('authController');

    router.post('/register', sensitiveLimiter, validateRegister, async (req, res, next) => {
        try {
            await authController.register(req, res, next);
        } catch (error) {
            next(error);
        }
    });

    router.get(
        '/verify-email',
        validate(Joi.object({
            token: Joi.string().required().messages({
                'string.base': 'Token must be a string',
                'any.required': 'Token is required',
            }),
        }), 'query'),
        (req, res, next) => {
            authController.verifyEmail(req, res, next);
        }
    );

    router.post(
        '/resend-verification-email',
        validate(Joi.object({
            userId: Joi.string(),
            email: Joi.string().email()
        }).or('userId', 'email'), 'body'),
        (req, res, next) => authController.resendVerificationEmail(req, res, next)
    );


    return router;
};
