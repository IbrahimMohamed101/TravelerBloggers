const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

class TokenService {
    constructor(redisService) {
        this.redisService = redisService;
    }

    async generateToken(payload, expiresIn = '1h') {
        try {
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn }
            );
            return token;
        } catch (error) {
            logger.error('Token generation error:', error);
            throw error;
        }
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            logger.error('Token verification error:', error);
            throw error;
        }
    }

    async generateRefreshToken(userId) {
        const refreshToken = uuidv4();
        const expiresIn = 30 * 24 * 60 * 60; // 30 days

        await this.redisService.setWithExpiry(
            `refresh_token:${refreshToken}`,
            { userId },
            expiresIn
        );

        return refreshToken;
    }

    async verifyRefreshToken(refreshToken) {
        const data = await this.redisService.getWithExpiry(`refresh_token:${refreshToken}`);
        return data ? data.userId : null;
    }

    async revokeRefreshToken(refreshToken) {
        return await this.redisService.deleteKey(`refresh_token:${refreshToken}`);
    }
}

module.exports = TokenService;
