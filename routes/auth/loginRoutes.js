const express = require('express');
const router = express.Router();
const { sensitiveLimiter } = require('../../middlewares/rateLimiter');
const { validateLogin, validate } = require('../../middlewares/validate');
const Joi = require('joi');

module.exports = (container) => {
    const authController = container.getController('authController');

    router.post('/login', sensitiveLimiter, validateLogin, (req, res, next) => {
        authController.login(req, res, next);
    });

    router.post('/refresh-token',
        validate(Joi.object({ refresh_token: Joi.string().required() })),
        (req, res, next) => {
            authController.refreshToken(req, res, next);
        }
    );

    return router;
};
