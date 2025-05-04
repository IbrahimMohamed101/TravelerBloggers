const express = require('express');
const verifyJWT = require('../../middlewares/verifyJWT');
const { validateUpdateProfile, validatePasswordChange } = require('../../middlewares/validate');
const upload = require('../../middlewares/multer');

module.exports = function (container) {
    const router = express.Router();
    const userController = container.getController('userController');

    if (!userController) {
        throw new Error("userController is not defined in the container. Please check your container configuration.");
    }

    // Get user profile
    router.get('/profile', verifyJWT(), userController.getProfile.bind(userController));

    // Update user profile
    router.put('/profile', verifyJWT(), validateUpdateProfile, userController.updateProfile.bind(userController));

    // Delete user profile
    router.delete('/profile', verifyJWT(), userController.deleteProfile.bind(userController));

    // Update user avatar
    router.put('/profile/avatar', verifyJWT(), upload.single('avatar'), userController.updateAvatar.bind(userController));

    // Delete user avatar
    router.delete('/profile/avatar', verifyJWT(), userController.deleteAvatar.bind(userController));


    return router;
};
