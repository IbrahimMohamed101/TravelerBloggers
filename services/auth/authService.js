const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');

class AuthService {
    constructor(db, redisService, tokenService, sessionService, oauthService) {
        this.db = db;
        this.redisService = redisService;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.oauthService = oauthService;
    }

    async register(userData, ipAddress, userAgent) {
        try {
            // التحقق من وجود المستخدم
            const existingUser = await this.db.users.findOne({
                where: { email: userData.email }
            });

            if (existingUser) {
                throw new Error('Email already registered');
            }

            // تشفير كلمة المرور
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // إنشاء المستخدم
            const user = await this.db.users.create({
                ...userData,
                password: hashedPassword,
                emailVerified: false
            });

            // إنشاء رمز التحقق من البريد
            const verificationToken = await this.tokenService.generateToken(
                { userId: user.id, type: 'email_verification' },
                '24h'
            );

            // إنشاء جلسة
            const session = await this.sessionService.createSession(
                user.id,
                ipAddress,
                userAgent
            );

            // TODO: إرسال بريد التحقق

            return {
                user: this._sanitizeUser(user),
                token: session.token
            };
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    async login(email, password, ipAddress, userAgent) {
        try {
            // التحقق من وجود المستخدم
            const user = await this.db.users.findOne({
                where: { email }
            });

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // التحقق من قفل الحساب
            const isLocked = await this._checkAccountLock(email);
            if (isLocked) {
                throw new Error('Account is locked. Please try again later');
            }

            // التحقق من كلمة المرور
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                await this._incrementLoginAttempts(email);
                throw new Error('Invalid credentials');
            }

            // إنشاء جلسة
            const session = await this.sessionService.createSession(
                user.id,
                ipAddress,
                userAgent
            );

            // إعادة تعيين محاولات تسجيل الدخول
            await this._resetLoginAttempts(email);

            return {
                user: this._sanitizeUser(user),
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
                throw new Error('Invalid refresh token');
            }

            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
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
            return user ? this._sanitizeUser(user) : null;
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

    _sanitizeUser(user) {
        const { password, ...sanitizedUser } = user.toJSON();
        return sanitizedUser;
    }
}

module.exports = AuthService;
