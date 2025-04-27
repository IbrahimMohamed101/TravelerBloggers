const express = require('express');
const router = express.Router();
const { sensitiveLimiter } = require('../../middlewares/rateLimiter');
const { validateLogin } = require('../../middlewares/validate');

module.exports = (container) => {
    const authController = container.getController('authController');

    router.post('/login', sensitiveLimiter, validateLogin, (req, res, next) => {
        authController.login(req, res, next);
    });

    router.post('/auth/refresh-token', (req, res, next) => {
        authController.refreshToken(req, res, next);
    });


    return router;
};
