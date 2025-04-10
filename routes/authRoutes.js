const express = require('express');
const passport = require('passport');
const router = express.Router();
const container = require('../config/container');
const { sensitiveLimiter } = require('../middlewares/rateLimiter');
const { validateRegister, validateLogin } = require('../middlewares/validate');
const verifyJWT = require('../middlewares/verifyJWT');
let authController;

// Lazy getter for controller
function getAuthController() {
    if (!authController) {
        authController = container.getController('authController');
    }
    return authController;
}

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
router.post('/auth/register', sensitiveLimiter, validateRegister, (req, res, next) => {
    getAuthController().register(req, res, next);
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
router.post('/auth/login', sensitiveLimiter, validateLogin, (req, res, next) => {
    getAuthController().login(req, res, next);
});

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
router.get('/auth/:provider', (req, res, next) => {
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
router.get(
    '/auth/:provider/callback',
    (req, res, next) => {
        const provider = req.params.provider;
        passport.authenticate(provider, { failureRedirect: '/login' })(req, res, next);
    },
    (req, res, next) => {
        getAuthController().handleOAuthCallback(req, res, next);
    }
);

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
    getAuthController().requestPasswordReset(req, res, next);
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
    getAuthController().confirmPasswordReset(req, res, next);
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
    getAuthController().refreshToken(req, res, next);
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
router.post('/auth/change-password', verifyJWT(), (req, res, next) => {
    getAuthController().changePasswordDirectly(req, res, next);
});

module.exports = router;
