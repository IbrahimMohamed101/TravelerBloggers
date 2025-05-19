const express = require('express');
const router = express.Router();
const { sensitiveLimiter } = require('../../middlewares/rateLimiter');
const { validateLogin, validate } = require('../../validators/validate');
const Joi = require('joi');

module.exports = (container) => {
    const authController = container.getController('authController');

    router.post('/login', sensitiveLimiter, validateLogin, (req, res, next) => {
        authController.login(req, res, next);
    });

    return router;
};
