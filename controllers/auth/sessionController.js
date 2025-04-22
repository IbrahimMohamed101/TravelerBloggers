const logger = require('../../utils/logger');

class SessionController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }

    async getSessions(req, res) {
        try {
            const userId = req.user.id;
            const sessions = await this.sessionService.getUserSessions(userId);
            res.status(200).json(sessions);
        } catch (error) {
            logger.error(`Get sessions error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async revokeSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            await this.sessionService.revokeSession(sessionId, userId);
            res.status(200).json({ message: 'Session revoked successfully' });
        } catch (error) {
            logger.error(`Revoke session error: ${error.message}`);
            if (error.message === 'Session not found') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === 'Unauthorized') {
                return res.status(401).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async revokeAllSessions(req, res) {
        try {
            const userId = req.user.id;
            const currentSessionId = req.session.id;

            await this.sessionService.revokeAllSessions(userId, currentSessionId);
            res.status(200).json({ message: 'All sessions revoked successfully' });
        } catch (error) {
            logger.error(`Revoke all sessions error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = SessionController;
