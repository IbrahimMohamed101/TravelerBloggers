const express = require('express');
const router = express.Router();
const verifyJWT = require('../middlewares/verifyJWT');
const container = require('../config/container');
const authController = container.getController('authController');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: User session management
 */

/**
 * @swagger
 * /api/v1/users/auth/logout:
 *   post:
 *     tags: [Sessions]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/auth/logout', verifyJWT(), authController.logout.bind(authController));

/**
 * @swagger
 * /api/v1/users/auth/sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: Get active sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 */
router.get('/auth/sessions', verifyJWT(), authController.getSessions.bind(authController));

/**
 * @swagger
 * /api/v1/users/auth/sessions/revoke:
 *   post:
 *     tags: [Sessions]
 *     summary: Revoke session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevokeSession'
 *     responses:
 *       200:
 *         description: Session revoked successfully
 */
router.post('/auth/sessions/revoke', verifyJWT(), authController.revokeSession.bind(authController));

module.exports = router;
