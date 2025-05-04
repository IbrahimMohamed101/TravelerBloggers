const logger = require('../../utils/logger');
const emailHelper = require('../../utils/emailHelper');
const sendEmail = require('../../utils/Nodemailer');

class PasswordController {
    constructor(passwordService) {
        this.passwordService = passwordService;
    }
    async changePassword(req, res) {
        try {
            logger.info('changePassword method called', {
                userId: req.user?.id,
                hasUser: !!req.user,
                bodyKeys: Object.keys(req.body || {}),
                authorizationHeaderPresent: !!req.headers.authorization,
                authorizationHeader: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : null
            });

            if (!req.user || !req.user.id) {
                logger.error('No user information in request');
                return res.status(401).json({ message: 'Unauthorized: User not identified' });
            }

            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                logger.error('Missing password fields', {
                    currentPasswordProvided: !!currentPassword,
                    newPasswordProvided: !!newPassword
                });
                return res.status(400).json({ message: 'Current and new passwords are required' });
            }

            logger.info('Calling passwordService.changePassword...');
            await this.passwordService.changePassword(userId, currentPassword, newPassword);
            logger.info('passwordService.changePassword completed successfully');

            if (!res.headersSent) {
                res.status(200).json({ message: 'Password changed successfully' });
                logger.info('Response sent for changePassword');
                return; // Ensure no further code runs after response
            }

        } catch (error) {
            logger.error(`Change password error: ${error.message}`, {
                errorName: error.name,
                errorStack: error.stack
            });

            if (res.headersSent) {
                logger.warn('Headers already sent, cannot respond again');
                return;
            }

            if (error.message === 'Invalid current password') {
                return res.status(401).json({ message: error.message });
            }

            return res.status(500).json({
                message: 'Server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
            });
        }
    }



    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            const resetToken = await this.passwordService.createPasswordResetToken(email);

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
            await this.passwordService.resetPassword(token, newPassword);
            res.status(200).json({ message: 'Password reset successfully' });
        } catch (error) {
            logger.error(`Password reset error: ${error.message}`);
            if (error.message === 'Invalid or expired reset token') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = PasswordController;
