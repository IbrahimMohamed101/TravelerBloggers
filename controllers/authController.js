const logger = require('../utils/logger');
const { generateToken } = require('../utils/generateToken');
const sendEmail = require('../utils/Nodemailer');
const emailHelper = require('../utils/emailHelper');

class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async register(req, res) {
        try {
            const result = await this.authService.registerUserWithOAuth({
                ...req.body,
                discord_token: req.body.discord_token // Add Discord token if present
            });

            // Send welcome email
            const welcomeEmail = await emailHelper.getWelcomeEmail(result.user.first_name);
            await sendEmail(
                result.user.email,
                'Welcome to Traveler Bloggers',
                `Welcome ${result.user.first_name}!\n\nThank you for registering with Traveler Bloggers platform.\n\nStart exploring and sharing your travel experiences with us!`,
                welcomeEmail.html,
                welcomeEmail.attachments
            );

            res.status(201).json({
                message: 'User registered successfully',
                ...result,
            });
        } catch (error) {
            if (error.message === 'Email already exists' || error.message === 'Username already taken') {
                return res.status(409).json({ message: error.message });
            }
            if (error.message === 'Google token email mismatch' || error.message === 'Discord token email mismatch') {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === 'Facebook token email mismatch' || error.message === 'Invalid Facebook token') {
                return res.status(401).json({ message: error.message });
            }
            logger.error(`Registration error: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async login(req, res) {
        try {
            // Enhanced IP address extraction with debug logging and normalization
            let ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                req.connection?.socket?.remoteAddress ||
                req.ip ||
                '0.0.0.0';

            // Normalize IPv6-mapped IPv4 addresses
            if (ipAddress.startsWith('::ffff:')) {
                ipAddress = ipAddress.substring(7);
            }

            logger.info(`Extracted and normalized IP address: ${ipAddress} from headers: ${JSON.stringify(req.headers)}`);

            // Get user agent with fallback
            const userAgent = req.get('User-Agent') || 'unknown';

            // Prepare login data with all required fields
            const loginData = {
                ...req.body,
                discord_token: req.body.discord_token,
                ipAddress: ipAddress || '0.0.0.0', // Ensure we never pass null/undefined
                userAgent: userAgent
            };

            // Double validation - should match service validation
            if (typeof loginData.ipAddress !== 'string') {
                loginData.ipAddress = '0.0.0.0';
            }

            // Call auth service with complete data
            const result = await this.authService.loginUserWithOAuth(loginData);

            res.status(200).json({
                message: 'User logged in successfully',
                ...result,
            });
        } catch (error) {
            logger.error(`Error in login: ${error.message}`);
            if (error.message === 'Invalid email or password') {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === 'Google token email mismatch' || error.message === 'Discord token email mismatch') {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === 'Facebook token email mismatch' || error.message === 'Invalid Facebook token') {
                return res.status(401).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async loginWithDiscord(req, res) {
        logger.info(`Received request to login with Discord for user: ${req.user.id}`);

        try {
            const user = await this.authService.getUserById(req.user.id);
            const token = generateToken(user);
            const refreshToken = await this.authService.generateRefreshToken(user.id);

            res.status(200).json({
                message: 'User logged in successfully with Discord',
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                token,
                refreshToken
            });
        } catch (error) {
            logger.error(`Error logging in with Discord: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async loginWithGoogle(req, res) {
        logger.info(`Received request to login with Google for user: ${req.user.id}`);

        try {
            const user = await this.authService.getUserById(req.user.id);
            const token = generateToken(user);
            const refreshToken = await this.authService.generateRefreshToken(user.id);

            res.status(200).json({
                message: 'User logged in successfully with Google',
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                token,
                refreshToken
            });
        } catch (error) {
            logger.error(`Error logging in with Google: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async loginWithFacebook(req, res) {
        logger.info(`Received request to login with Facebook for user: ${req.user.id}`);

        try {
            const user = await this.authService.getUserById(req.user.id);
            const token = generateToken(user);
            const refreshToken = await this.authService.generateRefreshToken(user.id);

            res.status(200).json({
                message: 'User logged in successfully with Facebook',
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                token,
                refreshToken
            });
        } catch (error) {
            logger.error(`Error logging in with Facebook: ${error.message}`);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async getUser(req, res) {
        logger.info(`Received request to fetch user with ID: ${req.params.id}`);

        try {
            const userId = req.params.id;
            const user = await this.authService.getUserById(userId);
            res.status(200).json({ user });
        } catch (error) {
            logger.error(`Error fetching user: ${error.message}`);
            if (error.message === 'User not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }

    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            const token = await this.authService.generatePasswordResetToken(email);

            // Send email with reset link
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
            const resetEmail = await emailHelper.getPasswordResetEmail(resetLink);
            await sendEmail(
                email,
                'Traveler Bloggers - Password Reset',
                `Password Reset Request\n\nWe received a request to reset your password. Please use this link:\n${resetLink}\n\nIf you didn't request this, please ignore this email.`,
                resetEmail.html,
                resetEmail.attachments
            );

            res.status(200).json({
                message: 'Password reset email sent'
            });
        } catch (error) {
            logger.error(`Error generating password reset token: ${error.message}`);
            if (error.message === 'User not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }

    async confirmPasswordReset(req, res) {
        try {
            const { token, newPassword } = req.body;
            await this.authService.resetPassword(token, newPassword);
            res.status(200).json({ message: 'Password reset successfully' });
        } catch (error) {
            logger.error(`Error resetting password: ${error.message}`);
            if (error.message === 'Invalid or expired token') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }

    async changePasswordDirectly(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            await this.authService.changePasswordDirectly(userId, currentPassword, newPassword);
            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error) {
            logger.error(`Error changing password: ${error.message}`);
            if (error.message === 'Current password is incorrect') {
                return res.status(401).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }

    async requestEmailVerification(req, res) {
        try {
            const { email } = req.user; // From JWT
            const token = await this.authService.generateEmailVerificationToken(email);

            // Send verification email
            const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
            const verifyEmail = await emailHelper.getEmailVerificationEmail(verifyLink);
            await sendEmail(
                email,
                'Traveler Bloggers - Verify Your Email',
                `Verify Your Email\n\nThank you for signing up with Traveler Bloggers! Please verify your email by visiting this link:\n${verifyLink}\n\nIf you didn't create an account, please ignore this email.`,
                verifyEmail.html,
                verifyEmail.attachments
            );
            res.status(200).json({
                message: 'Email verification sent'
            });
        } catch (error) {
            logger.error(`Error generating email verification token: ${error.message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async confirmEmailVerification(req, res) {
        try {
            const { token } = req.body;
            await this.authService.verifyEmail(token);
            res.status(200).json({ message: 'Email verified successfully' });
        } catch (error) {
            logger.error(`Error verifying email: ${error.message}`);
            if (error.message === 'Invalid token') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const userId = await this.authService.verifyRefreshToken(refreshToken);
            const user = await this.authService.getUserById(userId);
            const newToken = generateToken(user);
            const newRefreshToken = await this.authService.generateRefreshToken(userId);

            // Revoke the old refresh token
            await this.authService.revokeRefreshToken(refreshToken);

            res.status(200).json({
                message: 'Token refreshed successfully',
                token: newToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            logger.error(`Error refreshing token: ${error.message}`);
            if (error.message === 'Invalid or expired refresh token') {
                return res.status(401).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            await this.authService.revokeRefreshToken(refreshToken);
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            logger.error(`Error logging out: ${error.message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getSessions(req, res) {
        try {
            const sessions = await this.authService.getActiveSessions(req.user.id);
            res.status(200).json({
                message: 'Active sessions retrieved',
                sessions
            });
        } catch (error) {
            logger.error(`Error fetching sessions: ${error.message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async revokeSession(req, res) {
        try {
            const { token } = req.body;
            await this.authService.revokeSession(token);
            res.status(200).json({ message: 'Session revoked successfully' });
        } catch (error) {
            logger.error(`Error revoking session: ${error.message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }

    /**
     * Handle OAuth callback from any provider
     */
    async handleOAuthCallback(req, res) {
        try {
            const user = await this.authService.getUserById(req.user.id);
            const token = generateToken(user);
            const refreshToken = await this.authService.generateRefreshToken(user.id);

            res.status(200).json({
                message: `Logged in successfully with ${req.params.provider}`,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                token,
                refreshToken
            });
        } catch (error) {
            logger.error(`Error handling OAuth callback: ${error.message}`);
            res.status(500).json({
                message: 'Error during OAuth login',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;
