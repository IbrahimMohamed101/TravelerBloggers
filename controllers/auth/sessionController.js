class SessionController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }

    async logout(req, res, next) {
        try {
            let sessionId = req.headers['x-session-id'] || req.body.sessionId;

            if (!sessionId && req.user && req.user.sessionId) {
                sessionId = req.user.sessionId;
            }

            if (!sessionId) {
                return res.status(400).json({
                    message: 'Session ID is required for logout. Provide it in the "x-session-id" header or request body.'
                });
            }

            const success = await this.sessionService.revokeSession(sessionId);
            return res.status(200).json({
                message: success ? 'Logout successful' : 'Session not found or already expired'
            });
        } catch (error) {
            next(error);
        }
    }

    async getSessions(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: 'Unauthorized' });

            const sessions = await this.sessionService.getActiveSessions(userId);
            return res.status(200).json({ sessions });
        } catch (error) {
            next(error);
        }
    }

    async logoutAll(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: 'Unauthorized' });

            const success = await this.sessionService.revokeAllSessions(userId);
            return res.status(200).json({
                message: success ? 'All sessions revoked' : 'Failed to revoke sessions'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SessionController;
