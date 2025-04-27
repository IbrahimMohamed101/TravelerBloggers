const logger = require('../../utils/logger');
const { withTransaction } = require('../../utils/withTransaction.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

function timeoutPromise(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), ms)
        )
    ]);
}

class PasswordService {
    constructor(db, redisService, tokenService, sequelize) {
        this.db = db;
        this.redisService = redisService;
        this.tokenService = tokenService;
        this.sequelize = sequelize;
        this.User = db.users;
    }
    async changePassword(userId, currentPassword, newPassword) {
        return await withTransaction(this.sequelize, async (transaction) => {
            try {
                const user = await this.db.users.findOne({
                    where: { id: userId },
                    transaction
                });

                if (!user) {
                    throw new Error('User not found');
                }

                const isValid = await bcrypt.compare(currentPassword, user.password);

                if (!isValid) {
                    throw new Error('Invalid current password');
                }

                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await user.update({ password: hashedPassword }, { transaction });
                logger.info('User password updated');

                try {
                    logger.info('Attempting to revoke user sessions');
                    await timeoutPromise(this.redisService.deletePattern(`sessions:${userId}:*`), 3000);
                    logger.info('User sessions revoked');
                } catch (err) {
                    logger.warn(`Timeout or error revoking sessions: ${err.message}`);
                }

                return true;
            } catch (error) {

                logger.error(`Error changing password: ${error.message}`);
                throw error;
            }
        });
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
            logger.info(`Storing reset token in Redis with key: ${key} and userId: ${user.id}`);
            const result = await this.redisService.setWithExpiry(key, user.id, 3600); // 1 hour expiration
            logger.info(`Redis setWithExpiry result: ${result}`);

            return resetToken;
        } catch (error) {
            logger.error(`Error creating password reset token: ${error.message}`);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            logger.info(`Reset password called with token: ${token}`);

            // Hash token for comparison
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            logger.info(`Hashed token: ${hashedToken}`);

            // Get user ID from Redis
            const key = `password_reset:${hashedToken}`;
            logger.info(`Redis key: ${key}`);

            const userId = await this.redisService.getWithExpiry(key);
            logger.info(`User ID from Redis: ${userId}`);

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
            await this.redisService.deleteKey(key);

            // Revoke all sessions
            await this.redisService.deletePattern(`sessions:${userId}:*`);

            return true;
        } catch (error) {
            logger.error(`Error resetting password: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PasswordService;
