const { UnauthorizedError } = require('../../errors/CustomErrors');
const logger = require('../../utils/logger');
const jwt = require('jsonwebtoken');

class TokenService {
    constructor(redisService, db = null) {
        this.redisService = redisService;
        this.db = db;
    }

    async generateToken(payload, expiresIn = '1h') {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    }

    async verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new UnauthorizedError('Invalid token');
        }
    }

    async generateRefreshToken(userId, expiresIn = '7d', transaction = null) {
        const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn });

        // إذا كان db متاحًا، احفظ التوكن
        if (this.db && this.db.refresh_tokens) {
            await this.db.refresh_tokens.create({
                token: refreshToken,
                user_id: userId,
                is_revoked: false,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }, { transaction });
        }

        return refreshToken;
    }

    async verifyRefreshToken(refreshToken) {
        try {
            return jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
        } catch (error) {
            throw new UnauthorizedError('Invalid refresh token');
        }
    }

    async refreshToken(refreshToken) {
        try {
            const payload = await this.verifyRefreshToken(refreshToken);
            if (!payload || !payload.userId) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            // إذا كان db متاحًا، تحقق من حالة التوكن
            if (this.db && this.db.refresh_tokens) {
                const storedToken = await this.db.refresh_tokens.findOne({
                    where: { token: refreshToken, is_revoked: false }
                });
                if (!storedToken) {
                    throw new UnauthorizedError('Refresh token revoked or not found');
                }
            }

            const newToken = await this.generateToken({ userId: payload.userId });

            return { token: newToken, userId: payload.userId };
        } catch (error) {
            logger.error('Token refresh error:', error);
            throw error;
        }
    }

    async revokeToken(refreshToken) {
        try {
            // إذا كان db متاحًا، قم بإلغاء التوكن
            if (this.db && this.db.refresh_tokens) {
                const token = await this.db.refresh_tokens.findOne({
                    where: { token: refreshToken }
                });
                if (!token) {
                    throw new UnauthorizedError('Refresh token not found');
                }
                token.is_revoked = true;
                await token.save();
            }
        } catch (error) {
            logger.error('Token revoke error:', error);
            throw error;
        }
    }

    async listActiveTokens(userId) {
        try {
            // إذا كان db متاحًا، اسرد التوكنز النشطة
            if (this.db && this.db.refresh_tokens) {
                return await this.db.refresh_tokens.findAll({
                    where: { user_id: userId, is_revoked: false }
                });
            }
            return [];
        } catch (error) {
            logger.error('List tokens error:', error);
            throw error;
        }
    }

    async generateSessionToken({ userId, sessionId }, expiresIn = '15m') {
        return this.generateToken({ userId, sessionId }, expiresIn);
    }
}

module.exports = TokenService;
