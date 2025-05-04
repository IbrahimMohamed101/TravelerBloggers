const {
    ValidationError,
    ConflictError,
    UnauthorizedError,
} = require('../../errors/CustomErrors');
const { withTransaction } = require('../../utils/withTransaction.js');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class EmailVerificationService {
    constructor(db, tokenService, sequelize, emailService) {
        this.db = db;
        this.tokenService = tokenService;
        this.sequelize = sequelize;
        this.emailService = emailService;
    }

    async verifyEmail(token) {
        console.log('Token received for verification:', token); // Add logging to debug token
        let payload;
        try {
            payload = await this.tokenService.verifyToken(token);
        } catch (error) {
            logger.error('Email verification token invalid:', error);
            throw new UnauthorizedError('Invalid verification token');
        }
        return await withTransaction(this.sequelize, async (transaction) => {
            if (payload.type !== 'email_verification') {
                throw new UnauthorizedError('Invalid verification token');
            }

            const user = await this.db.users.findByPk(payload.userId, { transaction });
            if (!user) {
                throw new ValidationError('User not found');
            }

            if (user.email_verified) {
                throw new ConflictError('Email already verified');
            }

            await user.update(
                {
                    email_verified: true,
                    email_verified_at: new Date(),
                },
                { transaction }
            );
            logger.info(`Email verified successfully for user: ${user.email}`, { userId: user.id });

            await user.reload({ transaction });

            return {
                message: 'Email verified successfully',
                user: this.#sanitizeUser(user),
            };
        });
    }

    async resendVerificationEmailByIdentifier({ userId, email }) {
        let user;

        if (userId) {
            user = await this.db.users.findByPk(userId);
        } else if (email) {
            user = await this.db.users.findOne({ where: { email } });
        } else {
            throw new ValidationError('userId or email is required');
        }

        if (!user) throw new ValidationError('User not found');
        if (user.email_verified) throw new ConflictError('Email already verified');

        const token = await this.tokenService.generateToken(
            { userId: user.id, type: 'email_verification' },
            '1h'
        );

        await this.emailService.sendVerificationEmail({
            to: user.email,
            token,
            name: user.name || ''
        });

        logger.info(`Resent verification email to user: ${user.email}`, { userId: user.id });

        return { message: 'Verification email resent successfully' };
    }

    #sanitizeUser(user) {
        const { password, ...safeUser } = user.toJSON ? user.toJSON() : user;
        return safeUser;
    }
}

module.exports = EmailVerificationService;
