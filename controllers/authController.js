const logger = require('../utils/logger');
const { generateToken } = require('../utils/generateToken');

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
            const result = await this.authService.loginUserWithOAuth({
                ...req.body,
                discord_token: req.body.discord_token // Add Discord token if present
            });

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
}

module.exports = AuthController;
