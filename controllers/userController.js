const logger = require('../utils/logger');

class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    /**
     * Get user profile
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await this.userService.getUserProfile(userId);

            res.status(200).json({
                message: 'Profile retrieved successfully',
                profile: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    profile_picture: user.profile_picture,
                    created_at: user.created_at
                }
            });
        } catch (error) {
            logger.error(`Error getting profile: ${error.message}`);
            res.status(500).json({ message: 'Error retrieving profile' });
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updates = req.body;

            const updatedUser = await this.userService.updateUserProfile(userId, updates);

            res.status(200).json({
                message: 'Profile updated successfully',
                profile: {
                    id: updatedUser.id,
                    first_name: updatedUser.first_name,
                    last_name: updatedUser.last_name,
                    username: updatedUser.username,
                    bio: updatedUser.bio,
                    profile_picture: updatedUser.profile_picture
                }
            });
        } catch (error) {
            logger.error(`Error updating profile: ${error.message}`);
            if (error.message === 'Username already taken') {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: 'Error updating profile' });
        }
    }
    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            const user = await this.userService.getUserById(userId);

            res.status(200).json({
                message: 'User retrieved successfully',
                user,
            });
        } catch (error) {
            logger.error(`Error getting user by ID: ${error.message}`);
            res.status(500).json({ message: 'Error retrieving user' });
        }
    }
}

module.exports = UserController;
