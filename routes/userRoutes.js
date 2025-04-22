const express = require('express');
const verifyJWT = require('../middlewares/verifyJWT');
const { validateUpdateProfile, validatePasswordChange } = require('../middlewares/validate');

module.exports = function (container) {
    const router = express.Router();
    const userController = container.getController('userController');

    if (!userController) {
        throw new Error("userController is not defined in the container. Please check your container configuration.");
    }

    /**
     * @swagger
     * tags:
     *   name: User
     *   description: User profile management
     */

    /**
     * @swagger
     * /api/v1/users/profile:
     *   get:
     *     tags: [User]
     *     summary: Get user profile
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile data
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

    router.get('/:id', verifyJWT(), userController.getUserById.bind(userController));

    return router;
};
