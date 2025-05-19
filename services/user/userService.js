const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ConflictError, ValidationError } = require('../../errors/CustomErrors');

class UserService {
    constructor(db, redisService, tokenService) {
        this.db = db;
        this.redisService = redisService;
        this.tokenService = tokenService;
        this.User = db.users;
    }

    async getProfile(userId) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }
            const { password, ...userWithoutPassword } = user.toJSON();
            return userWithoutPassword;
        } catch (error) {
            logger.error(`Error fetching user profile: ${error.message}`);
            throw error;
        }
    }

    async deleteProfile(userId) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            // Delete user sessions
            await this.redisService.deletePattern(`sessions:${userId}:*`);

            // Delete user
            await user.destroy();

            return true;
        } catch (error) {
            logger.error(`Error deleting profile: ${error.message}`);
            throw error;
        }
    }

    async updateProfile(userId, updateData) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            // Check if email is being updated and if it's already taken
            if (updateData.email && updateData.email !== user.email) {
                const existingUser = await this.User.findOne({
                    where: { email: updateData.email }
                });
                if (existingUser) {
                    throw new ConflictError('Email already exists');
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


    async deleteAccount(userId, password) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                throw new ValidationError('Invalid password');
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
    async updateAvatar(userId, avatarUrl) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            // تحديث صورة المستخدم
            await user.update({
                profile_image: avatarUrl
            });

            // Reload user to get updated data
            await user.reload();

            const { password, ...userWithoutPassword } = user.toJSON();
            return userWithoutPassword;
        } catch (error) {
            logger.error(`Error updating avatar: ${error.message}`);
            throw error;
        }
    }

    async deleteAvatar(userId) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            // حذف صورة المستخدم
            await user.update({ profile_image: null });

            return true;
        } catch (error) {
            logger.error(`Error deleting avatar: ${error.message}`);
            throw error;
        }
    }

}

module.exports = UserService;
