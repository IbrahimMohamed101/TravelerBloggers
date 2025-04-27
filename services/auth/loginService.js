const bcrypt = require('bcrypt');
const { UnauthorizedError, ConflictError } = require('../../errors/CustomErrors');
const logger = require('../../utils/logger');

class LoginService {
    constructor(db, tokenService, sessionService, redisService) {
        this.db = db;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.redisService = redisService;
    }

    async login(email, password, ipAddress, userAgent) {
        try {
            const user = await this.db.users.findOne({
                where: { email }
            });

            if (!user) {
                throw new UnauthorizedError('Invalid credentials');
            }

            const isLocked = await this._checkAccountLock(email);
            if (isLocked) {
                throw new UnauthorizedError('Account is locked. Please try again later');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                await this._incrementLoginAttempts(email);
                throw new UnauthorizedError('Invalid credentials');
            }

            if (!user.email_verified) {
                throw new ConflictError('Please verify your email before logging in');
            }

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

            const refreshToken = await this.tokenService.generateRefreshToken(user.id);

            await this.db.refresh_tokens.create({
                token: refreshToken,
                user_id: user.id,
                revoked: false,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            await this._resetLoginAttempts(email);

            return {
                user: this.#sanitizeUser(user),
                token: session.token,
                refreshToken: refreshToken
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

    // Helper methods
    async _checkAccountLock(email) {
        const attempts = await this.redisService.getWithExpiry(`login_attempts:${email}`);
        return attempts && attempts >= 5;
    }

    async _incrementLoginAttempts(email) {
        const attempts = await this.redisService.getWithExpiry(`login_attempts:${email}`) || 0;
        await this.redisService.setWithExpiry(`login_attempts:${email}`, attempts + 1, 15 * 60);
    }

    async _resetLoginAttempts(email) {
        await this.redisService.deleteKey(`login_attempts:${email}`);
    }

    #sanitizeUser(user) {
        const { password, ...safeUser } = user.toJSON ? user.toJSON() : user;
        return safeUser;
    }
}

module.exports = LoginService;
