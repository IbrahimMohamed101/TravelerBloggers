const express = require('express');
const verifyJWT = require('../middlewares/verifyJWT');

module.exports = function (container) {
    const router = express.Router();
    const sessionController = container.getController('sessionController');
    const authController = container.getController('authController');

    /**
     * @swagger
     * tags:
     *   name: Sessions
     *   description: User session management
     */

    /**
     * @swagger
     * /api/v1/sessions:
     *   get:
     *     tags: [Sessions]
     *     summary: Get all user sessions
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
    router.get('/auth/sessions', verifyJWT(), sessionController.getSessions.bind(sessionController));

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
    router.post('/auth/sessions/revoke', verifyJWT(), sessionController.revokeSession.bind(sessionController));

    return router;
};
