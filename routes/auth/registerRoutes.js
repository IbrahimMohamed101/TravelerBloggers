const express = require('express');
const router = express.Router();
const { sensitiveLimiter } = require('../../middlewares/rateLimiter');
const { validateRegister, validate } = require('../../middlewares/validate');
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

    router.get(
        '/resend-verification-email',
        validate(Joi.object({
            userId: Joi.string().required().messages({
                'string.base': 'userId must be a string',
                'any.required': 'userId is required',
            }),
        }), 'query'),
        async (req, res, next) => {
            try {
                await authController.resendVerificationEmail(req, res, next);
            } catch (error) {
                next(error);
            }
        }
    );

    return router;
};
