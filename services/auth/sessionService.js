const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');
class SessionService {
    constructor(redisService, tokenService) {
        this.redisService = redisService;
        this.tokenService = tokenService;
    }

    // Create a new session and store in Redis
    async createSession(userId, ipAddress, userAgent = null, deviceInfo = null) {
        try {
            const sessionId = uuidv4();
            const token = await this.tokenService.generateSessionToken({ userId, sessionId });

            const sessionData = {
                userId,
                token,
                ipAddress,
                userAgent,
                deviceInfo,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 86400000).toISOString() // 24h
            };

            await Promise.all([
                this.redisService.setWithExpiry(`session:${sessionId}`, sessionData, 86400),
                this.redisService.addToList(`user_sessions:${userId}`, sessionId, 86400)
            ]);

            return { sessionId, token };
        } catch (error) {
            logger.error('Session creation failed:', error);
            throw error;
        }
    }

    // Validate session by checking its existence and expiry
    async validateSession(sessionId) {
        try {
            const session = await this.redisService.getWithExpiry(`session:${sessionId}`);
            if (!session) return null;

            if (new Date(session.expiresAt) < new Date()) {
                await this.revokeSession(sessionId);
                return null;
            }

            return session;
        } catch (error) {
            logger.error(`Session validation error for ID "${sessionId}":`, error);
            return null;
        }
    }

    // Revoke a single session
    async revokeSession(sessionId) {
        try {
            const session = await this.redisService.getWithExpiry(`session:${sessionId}`);
            if (session?.userId) {
                await this.redisService.removeFromList(`user_sessions:${session.userId}`, sessionId);
            }
            await this.redisService.deleteKey(`session:${sessionId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to revoke session "${sessionId}":`, error);
            return false;
        }
    }

    // Get all active sessions for a user
    async getActiveSessions(userId) {
        try {
            const sessionIds = await this.redisService.getList(`user_sessions:${userId}`) || [];
            const sessions = await Promise.all(
                sessionIds.map(id => this.redisService.getWithExpiry(`session:${id}`))
            );
            return sessions.filter(Boolean);
        } catch (error) {
            logger.error(`Error retrieving active sessions for user "${userId}":`, error);
            return [];
        }
    }

    // Revoke all sessions for a user
    async revokeAllSessions(userId) {
        try {
            const sessionIds = await this.redisService.getList(`user_sessions:${userId}`) || [];
            await Promise.all(sessionIds.map(id => this.redisService.deleteKey(`session:${id}`)));
            await this.redisService.deleteKey(`user_sessions:${userId}`);
            return true;
        } catch (error) {
            logger.error(`Error revoking all sessions for user "${userId}":`, error);
            return false;
        }
    }
}

module.exports = SessionService;
