const logger = require('../../utils/logger');

class OAuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async loginWithGoogle(req, res) {
        try {
            const { token } = req.body;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            const result = await this.authService.loginWithGoogle(token, ipAddress, userAgent);
            res.status(200).json(result);
        } catch (error) {
            logger.error(`Google login error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async loginWithFacebook(req, res) {
        try {
            const { token } = req.body;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            const result = await this.authService.loginWithFacebook(token, ipAddress, userAgent);
            res.status(200).json(result);
        } catch (error) {
            logger.error(`Facebook login error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async loginWithDiscord(req, res) {
        try {
            const { token } = req.body;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            const result = await this.authService.loginWithDiscord(token, ipAddress, userAgent);
            res.status(200).json(result);
        } catch (error) {
            logger.error(`Discord login error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async handleOAuthCallback(req, res) {
        try {
            const { provider } = req.params;
            const { code } = req.query;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            const result = await this.authService.handleOAuthCallback(
                provider,
                code,
                ipAddress,
                userAgent
            );

            res.status(200).json(result);
        } catch (error) {
            logger.error(`OAuth callback error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = OAuthController;
