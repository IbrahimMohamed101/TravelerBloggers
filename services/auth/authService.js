const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');
const { ValidationError, ConflictError, UnauthorizedError } = require('../../errors/CustomErrors');
const { withTransaction } = require('../../utils/withTransaction.js');
const Joi = require('joi');
class AuthService {
    constructor(db, redisService, tokenService, sessionService, oauthService, emailService, sequelize) {
        this.db = db;
        this.redisService = redisService;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.oauthService = oauthService;
        this.emailService = emailService;
        this.sequelize = sequelize;
    }



    async register(userData, ipAddress, userAgent) {
        return await withTransaction(this.sequelize, async (transaction) => {
            // التحقق من وجود المستخدم
            const existingUser = await this.db.users.findOne({
                where: { email: userData.email },
                transaction
            });

            if (existingUser) {
                throw new ConflictError('Email already registered');
            }

            // تشفير كلمة المرور
            const hashedPassword = await bcrypt.hash(userData.password, 12);

            // إنشاء المستخدم
            const user = await this.db.users.create({
                ...userData,
                password: hashedPassword,
                emailVerified: false,
                createdAt: new Date(),
            }, { transaction });

            // إنشاء رمز التحقق من البريد
            const verificationToken = await this.tokenService.generateToken(
                { userId: user.id, type: 'email_verification' },
                '24h'
            );

            // إرسال بريد التحقق
            await this.emailService.sendVerificationEmail({
                to: user.email,
                token: verificationToken,
                name: user.name,
            });

            // إنشاء جلسة
            const session = await this.sessionService.createSession(
                user.id,
                ipAddress,
                userAgent
            );

            await this.redisService.setWithExpiry(
                `session:${session.id}`,
                session,
                24 * 60 * 60 // انتهاء الصلاحية بعد 24 ساعة
            );

            return {
                user: this.#sanitizeUser(user),
                token: session.token,
            };

        });
    }

    async verifyEmail(token) {
        return await withTransaction(this.sequelize, async (transaction) => {

            const payload = await this.tokenService.verifyToken(token);
            if (payload.type !== 'email_verification') {
                throw new ValidationError('Invalid verification token');
            }

            // Find the user
            const user = await this.db.users.findByPk(payload.userId, { transaction });
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Check if email is already verified
            if (user.email_verified) {
                throw new ConflictError('Email already verified');
            }
            // Update user verification status
            await user.update(
                {
                    email_verified: true,
                    email_verified_at: new Date(),
                },
                { transaction }
            );
            logger.info(`Email verified successfully for user: ${user.email}`, { userId: user.id });

            // Reload user to get updated fields
            await user.reload({ transaction });

            return {
                message: 'Email verified successfully',
                user: this.#sanitizeUser(user),
            };
        });
    }


    async login(email, password, ipAddress, userAgent) {
        try {
            // التحقق من وجود المستخدم
            const user = await this.db.users.findOne({
                where: { email }
            });

            if (!user) {
                throw new UnauthorizedError('Invalid credentials');
            }

            // التحقق من قفل الحساب
            const isLocked = await this._checkAccountLock(email);
            if (isLocked) {
                throw new UnauthorizedError('Account is locked. Please try again later');
            }

            // التحقق من كلمة المرور
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                await this._incrementLoginAttempts(email);
                throw new UnauthorizedError('Invalid credentials');
            }

            if (!user.email_verified) {
                throw new ConflictError('Please verify your email before logging in');
            }


            // إنشاء جلسة
            const session = await this.sessionService.createSession(
                user.id,
                ipAddress,
                userAgent
            );

            await this.redisService.setWithExpiry(
                `session:${session.id}`,
                session,
                24 * 60 * 60
            );


            // إعادة تعيين محاولات تسجيل الدخول
            await this._resetLoginAttempts(email);

            return {
                user: this.#sanitizeUser(user),
                token: session.token
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    async logout(sessionId) {
        try {
            await this.sessionService.revokeSession(sessionId);
            return true;
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            const userId = await this.tokenService.verifyRefreshToken(refreshToken);
            if (!userId) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            const user = await this.getUserById(userId);
            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            const newToken = await this.tokenService.generateToken({ userId });
            return { token: newToken };
        } catch (error) {
            logger.error('Token refresh error:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const user = await this.db.users.findByPk(userId);
            return user ? this.#sanitizeUser(user) : null;
        } catch (error) {
            logger.error('Get user error:', error);
            throw error;
        }
    }

    // Helper methods
    async _checkAccountLock(email) {
        const attempts = await this.redisService.getWithExpiry(`login_attempts:${email}`);
        return attempts && attempts >= 5;
    }

    async _incrementLoginAttempts(email) {
        const attempts = await this.redisService.getWithExpiry(`login_attempts:${email}`) || 0;
        await this.redisService.setWithExpiry(`login_attempts:${email}`, attempts + 1, 15 * 60); // 15 minutes
    }

    async _resetLoginAttempts(email) {
        await this.redisService.deleteKey(`login_attempts:${email}`);
    }

    #sanitizeUser(user) {
        const { password, ...safeUser } = user.toJSON ? user.toJSON() : user;
        return safeUser;
    }
}

module.exports = AuthService;
