const express = require('express');
const passport = require('passport');
const router = express.Router();
const { sensitiveLimiter } = require('../middlewares/rateLimiter');
const { validateRegister, validateLogin, validate } = require('../middlewares/validate');
const Joi = require('joi');
const verifyJWT = require('../middlewares/verifyJWT');
const authService = require('../services/auth/authService');

module.exports = (container) => {
    const router = express.Router();
    const authController = container.getController('authController');
    const oauthController = container.getController('oauthController');
    const sessionController = container.getController('sessionController');

    const verifyEmailSchema = Joi.object({
        token: Joi.string().required().messages({
            'string.base': 'Token must be a string',
            'any.required': 'Token is required',
        }),
    });

    /**
     * @swagger
     * tags:
     *   name: Authentication
     *   description: User authentication endpoints
     */

    /**
     * @swagger
     * /api/v1/users/auth/register:
     *   post:
     *     tags: [Authentication]
     *     summary: Register new user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UserRegister'
     *     responses:
     *       201:
     *         description: User registered successfully
     */
    router.post('/register', sensitiveLimiter, validateRegister, async (req, res, next) => {
        try {
            await authController.register(req, res, next);
        } catch (error) {
            next(error);
        }
    });

    /**
     * @swagger
     * /api/v1/users/auth/login:
     *   post:
     *     tags: [Authentication]
     *     summary: Login user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UserLogin'
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthToken'
     */
    router.post('/login', sensitiveLimiter, validateLogin, (req, res, next) => {
        authController.login(req, res, next);
    });

    router.get(
        '/verify-email',
        validate(verifyEmailSchema, 'query'),
        (req, res, next) => {
            authController.verifyEmail(req, res, next);
        }
    );

    /**
     * @swagger
     * /api/v1/users/auth/{provider}:
     *   get:
     *     tags: [Authentication]
     *     summary: Start OAuth2 flow
     *     parameters:
     *       - in: path
     *         name: provider
     *         required: true
     *         schema:
     *           type: string
     *           enum: [google, facebook, discord]
     *     responses:
     *       302:
     *         description: Redirect to provider's authentication page
     */
    router.get('/:provider', (req, res, next) => {
        const provider = req.params.provider;
        passport.authenticate(provider)(req, res, next);
    });

    /**
     * @swagger
     * /api/v1/users/auth/{provider}/callback:
     *   get:
     *     tags: [Authentication]
     *     summary: OAuth2 callback
     *     parameters:
     *       - in: path
     *         name: provider
     *         required: true
     *         schema:
     *           type: string
     *           enum: [google, facebook, discord]
     *     responses:
     *       302:
     *         description: Redirect to success/failure URL
     *       401:
     *         description: Authentication failed
     */
    router.get('/:provider/callback', (req, res, next) => {
        const provider = req.params.provider;
        passport.authenticate(provider, {
            failureRedirect: '/auth/login'
        })(req, res, next);
    }, (req, res, next) => {
        authController.handleOAuthCallback(req, res, next);
    });

    /**
     * @swagger
     * /api/v1/users/auth/password-reset:
     *   post:
     *     tags: [Authentication]
     *     summary: Request password reset
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/PasswordResetRequest'
     *     responses:
     *       200:
     *         description: Password reset email sent
     */
    router.post('/auth/password-reset', sensitiveLimiter, (req, res, next) => {
        authController.requestPasswordReset(req, res, next);
    });

    /**
     * @swagger
     * /api/v1/users/auth/password-reset/confirm:
     *   post:
     *     tags: [Authentication]
     *     summary: Confirm password reset
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/PasswordResetConfirm'
     *     responses:
     *       200:
     *         description: Password reset successful
     */
    router.post('/auth/password-reset/confirm', (req, res, next) => {
        authController.confirmPasswordReset(req, res, next);
    });

    /**
     * @swagger
     * /api/v1/users/auth/refresh-token:
     *   post:
     *     tags: [Authentication]
     *     summary: Refresh access token
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RefreshToken'
     *     responses:
     *       200:
     *         description: New access token generated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthToken'
     */
    router.post('/auth/refresh-token', (req, res, next) => {
        authController.refreshToken(req, res, next);
    });

    /**
     * @swagger
     * /api/v1/users/auth/change-password:
     *   post:
     *     tags: [Authentication]
     *     summary: Change password (authenticated)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/PasswordChange'
     *     responses:
     *       200:
     *         description: Password changed successfully
     */
    router.post('/change-password', verifyJWT, (req, res, next) => {
        authController.changePassword(req, res, next);
    });

    return router;
};
