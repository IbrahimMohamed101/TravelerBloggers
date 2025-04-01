const logger = require('../utils/logger');

class AuthController {
    constructor(authService) {
        this.authService = authService
    }

    async register(req, res) {
        try {
            const result = await this.authService.registerUser(req.body);
            res.status(201).json({
                message: 'User registered successfully',
                ...result,
            });

        } catch (error) {
            if (error.message === 'Email already exists' || error.message === 'Username already taken') {
                return res.status(409).json({ message: error.message });
            }
            if (error.message === 'Google token email mismatch') {
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
            const result = await this.authService.loginUser(req.body);
            res.status(200).json({
                message: 'User logged in successfully',
                ...result,
            });
        } catch (error) {
            logger.error(`Error in login: ${error.message}`);
            if (error.message === 'Invalid email or password') {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === 'Google token email mismatch') {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === 'Facebook token email mismatch' || error.message === 'Invalid Facebook token') {
                return res.status(401).json({ message: error.message });
            }
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
