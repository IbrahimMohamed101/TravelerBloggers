const express = require('express');
const router = express.Router();
const verifyJWT = require('../middlewares/verifyJWT');
const container = require('../config/container');
const userController = container.getController('userController');

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/profile', verifyJWT(), userController.getProfile.bind(userController));

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Updated user profile
 */
router.put('/profile', verifyJWT(), userController.updateProfile.bind(userController));

module.exports = router;
