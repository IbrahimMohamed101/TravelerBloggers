const express = require('express');
const passport = require('passport');
const router = express.Router();

module.exports = (container) => {
    const authController = container.getController('authController');

    router.get('/:provider', (req, res, next) => {
        const provider = req.params.provider;
        passport.authenticate(provider)(req, res, next);
    });

    router.get('/:provider/callback', (req, res, next) => {
        const provider = req.params.provider;
        passport.authenticate(provider, {
            failureRedirect: '/auth/login'
        })(req, res, next);
    }, (req, res, next) => {
        authController.handleOAuthCallback(req, res, next);
    });

    return router;
};
