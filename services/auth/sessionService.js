const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

class SessionService {
    constructor(redisService, tokenService) {
        this.redisService = redisService;
        this.tokenService = tokenService;
    }

    async createSession(userId, ipAddress, userAgent = null, deviceInfo = null) {
        try {
            const sessionId = uuidv4();
            const token = await this.tokenService.generateToken({ userId, sessionId });
            
            const sessionData = {
                userId,
                token,
                ipAddress,
                userAgent,
                deviceInfo,
                createdAt: new Date().toISOString()
            };

            await this.redisService.setWithExpiry(
                `session:${sessionId}`,
                sessionData,
                24 * 60 * 60 // 24 hours
            );

            return { sessionId, token };
        } catch (error) {
            logger.error('Session creation error:', error);
            throw error;
        }
    }

    async validateSession(sessionId) {
        try {
            const session = await this.redisService.getWithExpiry(`session:${sessionId}`);
            return session;
        } catch (error) {
            logger.error('Session validation error:', error);
            return null;
        }
    }

    async revokeSession(sessionId) {
        try {
            await this.redisService.deleteKey(`session:${sessionId}`);
            return true;
        } catch (error) {
            logger.error('Session revocation error:', error);
            return false;
        }
    }

    async getActiveSessions(userId) {
        // Note: This is a simplified version. In a real implementation,
        // you would need a way to query all sessions for a user
        try {
            const sessions = await this.redisService.getWithExpiry(`user_sessions:${userId}`);
            return sessions || [];
        } catch (error) {
            logger.error('Get active sessions error:', error);
            return [];
        }
    }

    async revokeAllSessions(userId) {
        try {
            const sessions = await this.getActiveSessions(userId);
            const promises = sessions.map(session => this.revokeSession(session.sessionId));
            await Promise.all(promises);
            return true;
        } catch (error) {
            logger.error('Revoke all sessions error:', error);
            return false;
        }
    }
}

module.exports = SessionService;
