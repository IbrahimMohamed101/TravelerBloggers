const express = require('express');
const logger = require('../../utils/logger');
const { validateChangePassword } = require('../../validators/validate');
const verifyJWT = require('../../middlewares/verifyJWT');

const router = express.Router();

module.exports = (container) => {
    const passwordController = container.getController('passwordController');
    logger.info('Password Controller initialized:', passwordController);

    router.post('/forgot-password', (req, res, next) => {
        passwordController.requestPasswordReset(req, res, next);
    });

    router.post('/reset-password', (req, res, next) => {
        passwordController.resetPassword(req, res, next);
    });

    router.put('/change-password', verifyJWT(), validateChangePassword, (req, res, next) => {
        logger.info('Change password route hit', {
            body: req.body,
            user: req.user
        });
        passwordController.changePassword(req, res, next);
    });

    return router;
};
