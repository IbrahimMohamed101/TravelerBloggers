const logger = require('../../utils/logger');
const emailHelper = require('../../utils/emailHelper');
const sendEmail = require('../../utils/Nodemailer');

class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    // 1. Get user profile
    async getProfile(req, res) {
        try {
            const userId = req.user.id; // Get user ID from the JWT
            const user = await this.userService.getProfile(userId); // Fetch user profile using the service
            res.status(200).json({
                message: 'Profile retrieved successfully',
                user: user
            });
        } catch (error) {
            logger.error(`Get profile error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    // 2. Update user profile
    async updateProfile(req, res) {
        try {
            const userId = req.user.id; // Get user ID from JWT
            const updateData = req.body; // Data to update from the request body

            // Call service to update profile
            const updatedUser = await this.userService.updateProfile(userId, updateData);

            res.status(200).json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            logger.error(`Update profile error: ${error.message}`);
            if (error.message === 'Email already exists') {
                return res.status(409).json({ message: error.message }); // Conflict if email exists
            }
            res.status(500).json({ message: 'Server error', error: error.message }); // Server error
        }
    }

    // 3. Delete user account
    async deleteAccount(req, res) {
        try {
            const userId = req.user.id; // Get user ID from JWT
            const { password } = req.body; // Get password from the request body

            // Call service to delete the account
            await this.userService.deleteAccount(userId, password);

            res.status(200).json({ message: 'Account deleted successfully' });
        } catch (error) {
            logger.error(`Delete account error: ${error.message}`);
            if (error.message === 'Invalid password') {
                return res.status(401).json({ message: error.message }); // Unauthorized if password is incorrect
            }
            res.status(500).json({ message: 'Server error', error: error.message }); // Server error
        }
    }

    // 4. Delete user profile (without password verification)
    async deleteProfile(req, res) {
        try {
            const userId = req.user.id; // Get user ID from JWT

            // Call service to delete the profile
            await this.userService.deleteProfile(userId);

            res.status(200).json({ message: 'Profile deleted successfully' });
        } catch (error) {
            logger.error(`Delete profile error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    // 5. Update user avatar
    async updateAvatar(req, res) {
        try {
            const userId = req.user.id;

            const avatarFile = req.file; // Assuming you're using multer for file uploads
            if (!avatarFile) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            const avatarFileName = avatarFile.filename; // Get the file name

            const updatedUser = await this.userService.updateAvatar(userId, avatarFileName);

            res.status(200).json({
                message: 'Avatar updated successfully',
                user: updatedUser
            });
        } catch (error) {
            logger.error(`Update avatar error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    // 6. Delete user avatar
    async deleteAvatar(req, res) {
        try {
            const userId = req.user.id;

            await this.userService.deleteAvatar(userId);

            res.status(200).json({ message: 'Avatar deleted successfully' });
        } catch (error) {
            logger.error(`Delete avatar error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = UserController;
