const logger = require('../../utils/logger');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class UserService {
    constructor(db, redisService, tokenService) {
        this.db = db;
        this.redisService = redisService;
        this.tokenService = tokenService;
        this.User = db.users;
    }

    async updateProfile(userId, updateData) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if email is being updated and if it's already taken
            if (updateData.email && updateData.email !== user.email) {
                const existingUser = await this.User.findOne({
                    where: { email: updateData.email }
                });
                if (existingUser) {
                    throw new Error('Email already exists');
                }
            }

            // Update user data
            await user.update(updateData);

            // Return updated user without sensitive information
            const { password, ...userWithoutPassword } = user.toJSON();
            return userWithoutPassword;
        } catch (error) {
            logger.error(`Error updating profile: ${error.message}`);
            throw error;
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                throw new Error('Invalid current password');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await user.update({ password: hashedPassword });

            // Revoke all sessions except current one
            await this.redisService.deletePattern(`sessions:${userId}:*`);

            return true;
        } catch (error) {
            logger.error(`Error changing password: ${error.message}`);
            throw error;
        }
    }

    async createPasswordResetToken(email) {
        try {
            const user = await this.User.findOne({ where: { email } });
            if (!user) {
                throw new Error('User not found');
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Store token in Redis with expiration
            const key = `password_reset:${hashedToken}`;
            await this.redisService.set(key, user.id, 3600); // 1 hour expiration

            return resetToken;
        } catch (error) {
            logger.error(`Error creating password reset token: ${error.message}`);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Hash token for comparison
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Get user ID from Redis
            const key = `password_reset:${hashedToken}`;
            const userId = await this.redisService.get(key);
            if (!userId) {
                throw new Error('Invalid or expired reset token');
            }

            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await user.update({ password: hashedPassword });

            // Delete reset token
            await this.redisService.del(key);

            // Revoke all sessions
            await this.redisService.deletePattern(`sessions:${userId}:*`);

            return true;
        } catch (error) {
            logger.error(`Error resetting password: ${error.message}`);
            throw error;
        }
    }

    async deleteAccount(userId, password) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                throw new Error('Invalid password');
            }

            // Delete user sessions
            await this.redisService.deletePattern(`sessions:${userId}:*`);

            // Delete user
            await user.destroy();

            return true;
        } catch (error) {
            logger.error(`Error deleting account: ${error.message}`);
            throw error;
        }
    }
    async getUserById(userId) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const { password, ...userWithoutPassword } = user.toJSON();
            return userWithoutPassword;
        } catch (error) {
            logger.error(`Error getting user by ID: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UserService;
