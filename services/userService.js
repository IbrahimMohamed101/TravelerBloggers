const logger = require('../utils/logger');
const db = require('../config/database');
const { ConflictError, ValidationError } = require('../errors/CustomErrors');


class UserService {
    constructor() {
        this.initialized = false;
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        try {
            // Check all possible naming conventions
            this.User = db.Users || db.users || db.User;
            if (!this.User) {
                throw new ValidationError('User model not found in database configuration');
            }
            this.initialized = true;
            logger.info('UserService initialized successfully');
        } catch (error) {
            logger.error('UserService initialization failed:', error);
            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initializationPromise;
        }
    }

    async getUserProfile(userId) {
        try {
            await this.ensureInitialized();
            const user = await this.User.findByPk(userId, {
                attributes: [
                    'id',
                    'first_name',
                    'last_name',
                    'username',
                    'email',
                    'bio',
                    'profile_picture',
                    'created_at'
                ]
            });

            if (!user) {
                throw new ValidationError('User not found');
            }

            return user;
        } catch (error) {
            logger.error(`Error getting user profile: ${error.message}`);
            throw error;
        }
    }

    async updateUserProfile(userId, updates) {
        try {
            await this.ensureInitialized();
            const user = await this.User.findByPk(userId);

            if (!user) {
                throw new ValidationError('User not found');
            }

            // Check if username is being updated and if it's already taken
            if (updates.username && updates.username !== user.username) {
                const existingUser = await this.User.findOne({
                    where: { username: updates.username }
                });
                if (existingUser) {
                    throw new ConflictError('Username already taken');
                }
            }

            // Update user fields
            await user.update(updates);

            return user;
        } catch (error) {
            logger.error(`Error updating user profile: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UserService;
