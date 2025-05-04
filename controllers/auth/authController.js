const logger = require('../../utils/logger');

class AuthController {
    constructor(authService, sessionService, tokenService, emailVerificationService) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.tokenService = tokenService;
        this.emailVerificationService = emailVerificationService;
    }

    async register(req, res, next) {
        try {
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            const result = await this.authService.register(
                req.body,
                ipAddress,
                userAgent
            );

            res.status(201).json({
                message: 'User registered successfully',
                ...result
            });
        } catch (error) {
            logger.error(`Registration error: ${error.message}`);
            next(error);
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            const result = await this.authService.login(
                email,
                password,
                ipAddress,
                userAgent
            );

            res.status(200).json(result);
        } catch (error) {
            logger.error(`Login error: ${error.name} - ${error.message}`);
            if (error.name === 'UnauthorizedError') {
                return res.status(401).json({ message: error.message });
            }
            if (error.name === 'ConflictError') {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async logout(req, res, next) {
        try {
            const sessionId = req.session?.id;
            if (!sessionId) {
                return res.status(401).json({ message: 'No session found' });
            }

            await this.authService.logout(sessionId);
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            logger.error(`Logout error: ${error.message}`);
            next(error);
        }
    }



    async verifyEmail(req, res, next) {
        try {
            const token = req.query.token; // <-- Ensure token is read from query
            const result = await this.authService.verifyEmail(token);
            res.status(200).json(result);
        } catch (error) {
            logger.error(`Email verification error: ${error.message}`);
            next(error);
        }
    }

    async resendVerificationEmail(req, res, next) {
        try {
            const { userId, email } = req.body;
            const result = await this.emailVerificationService.resendVerificationEmailByIdentifier({ userId, email });
            res.status(200).json(result);
        } catch (error) {
            logger.error(`Resend verification email error: ${error.message}`);
            next(error);
        }
    }

}

module.exports = AuthController;
