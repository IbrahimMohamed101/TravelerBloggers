const logger = require('../../utils/logger');
const { sequelize } = require('../../config/sequelize');
const models = require('../../models');

// Sample permissions to initialize
const permissions = [
    { name: 'create_blog', description: 'Create new blogs' },
    { name: 'edit_blog', description: 'Edit existing blogs' },
    { name: 'delete_blog', description: 'Delete blogs' },
    { name: 'manage_users', description: 'Manage user accounts' },
    { name: 'moderate_content', description: 'Moderate blogs and content' },
    { name: 'manage_categories', description: 'Manage categories' }
];

/**
 * Initializes permissions in the database and caches them in Redis
 * @param {Object} redisService - Redis service instance with get, set, and del methods
 */
async function initializePermissions(redisService) {
    try {
        logger.info('Starting permissions initialization');

        // Check if permissions are already cached in Redis
        const cacheKey = 'permissions:all';
        let cachedPermissions = null;

        if (redisService && redisService.enabled) {
            cachedPermissions = await redisService.get(cacheKey);
            if (cachedPermissions) {
                logger.info('Permissions loaded from Redis cache');
                return JSON.parse(cachedPermissions);
            }
        }

        // Create each permission individually
        const permissionModel = models.permissions;
        const createdPermissions = [];

        for (const permission of permissions) {
            const [dbPermission, created] = await permissionModel.findOrCreate({
                where: { name: permission.name },
                defaults: permission,
                individualHooks: true
            });
            createdPermissions.push(dbPermission);
        }

        // Cache permissions in Redis if available
        if (redisService && redisService.enabled) {
            await redisService.set(cacheKey, JSON.stringify(createdPermissions), 3600); // Cache for 1 hour
            logger.info('Permissions cached in Redis');
        }

        logger.info('Permissions initialized successfully');
        return createdPermissions;
    } catch (error) {
        logger.error(`Failed to initialize permissions: ${error.message}`, { stack: error.stack });
        throw error;
    }
}

/**
 * Retrieves all permissions
 * @param {Object} redisService - Redis service instance
 * @returns {Promise<Array>} - List of permissions
 */
async function getAllPermissions(redisService) {
    try {
        const cacheKey = 'permissions:all';
        let permissions = null;

        if (redisService && redisService.enabled) {
            permissions = await redisService.get(cacheKey);
            if (permissions) {
                return JSON.parse(permissions);
            }
        }

        permissions = await models.permissions.findAll();
        if (redisService && redisService.enabled) {
            await redisService.set(cacheKey, JSON.stringify(permissions), 3600);
        }

        return permissions;
    } catch (error) {
        logger.error(`Error fetching permissions: ${error.message}`);
        throw error;
    }
}

module.exports = {
    initializePermissions,
    getAllPermissions
};