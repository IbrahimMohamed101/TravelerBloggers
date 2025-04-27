const { ValidationError, ConflictError } = require('../../errors/CustomErrors');
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
        return await withTransaction(this.sequelize, async (transaction) => {
            const payload = await this.tokenService.verifyToken(token);
            if (payload.type !== 'email_verification') {
                throw new ValidationError('Invalid verification token');
            }

            const user = await this.db.users.findByPk(payload.userId, { transaction });
            if (!user) {
                throw new Error('User not found');
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

    async resendVerificationEmail(userId) {
        const user = await this.db.users.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (user.email_verified) {
            throw new ConflictError('Email already verified');
        }

        // Generate a new verification token
        const tokenPayload = {
            userId: user.id,
            type: 'email_verification',
        };
        const token = await this.tokenService.generateToken(tokenPayload, { expiresIn: '1h' });

        // Construct verification URL (assuming frontend URL is known)
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        // Load email template
        const templatePath = path.join(__dirname, '../../utils/emailTemplates/emailVerification.html');
        let emailHtml = await fs.readFile(templatePath, 'utf-8');
        emailHtml = emailHtml.replace('{{link}}', verificationUrl);

        // Send verification email
        await this.emailService.sendEmail({
            to: user.email,
            subject: 'Resend Email Verification',
            text: `Please verify your email by clicking the following link: ${verificationUrl}`,
            html: emailHtml,
        });

        logger.info(`Resent verification email to user: ${user.email}`, { userId: user.id });

        return {
            message: 'Verification email resent successfully',
        };
    }

    #sanitizeUser(user) {
        const { password, ...safeUser } = user.toJSON ? user.toJSON() : user;
        return safeUser;
    }
}

module.exports = EmailVerificationService;
