const logger = require('../../utils/logger');
const emailHelper = require('../../utils/emailHelper');
const sendEmail = require('../../utils/Nodemailer');

class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await this.userService.getUserProfile(userId);
            res.status(200).json({
                message: 'Profile retrieved successfully',
                user: user
            });
        } catch (error) {
            logger.error(`Get profile error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            const updatedUser = await this.userService.updateProfile(userId, updateData);
            res.status(200).json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            logger.error(`Update profile error: ${error.message}`);
            if (error.message === 'Email already exists') {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            await this.userService.changePassword(userId, currentPassword, newPassword);
            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error) {
            logger.error(`Change password error: ${error.message}`);
            if (error.message === 'Invalid current password') {
                return res.status(401).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            const resetToken = await this.userService.createPasswordResetToken(email);

            // Send password reset email
            const resetEmail = await emailHelper.getPasswordResetEmail(resetToken);
            await sendEmail(
                email,
                'Password Reset Request',
                'Please click the link below to reset your password',
                resetEmail.html,
                resetEmail.attachments
            );

            res.status(200).json({ message: 'Password reset email sent' });
        } catch (error) {
            logger.error(`Password reset request error: ${error.message}`);
            if (error.message === 'User not found') {
                // Still return success to prevent email enumeration
                return res.status(200).json({ message: 'Password reset email sent' });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            await this.userService.resetPassword(token, newPassword);
            res.status(200).json({ message: 'Password reset successfully' });
        } catch (error) {
            logger.error(`Password reset error: ${error.message}`);
            if (error.message === 'Invalid or expired reset token') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async deleteAccount(req, res) {
        try {
            const userId = req.user.id;
            const { password } = req.body;

            await this.userService.deleteAccount(userId, password);
            res.status(200).json({ message: 'Account deleted successfully' });
        } catch (error) {
            logger.error(`Delete account error: ${error.message}`);
            if (error.message === 'Invalid password') {
                return res.status(401).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            const user = await this.userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({
                message: 'User retrieved successfully',
                user: user
            });
        } catch (error) {
            logger.error(`Get user by ID error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = UserController;
