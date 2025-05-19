const logger = require('../../utils/logger');
const { sequelize } = require('../../config/sequelize');
const models = require('../../models');

// Sample role permissions to initialize
const rolePermissions = {
    super_admin: ['create_blog', 'edit_blog', 'delete_blog', 'manage_users', 'moderate_content', 'manage_categories'],
    admin: ['manage_users', 'moderate_content', 'manage_categories'],
    content_manager: ['create_blog', 'edit_blog', 'moderate_content'],
    blogger: ['create_blog', 'edit_blog'],
    user: ['create_blog']
};

/**
 * Initializes role permissions in the database
 * @param {Object} redisService - Redis service instance
 */
async function initializeRolePermissions(redisService) {
    try {
        logger.info('Starting role permissions initialization');

        for (const [role, perms] of Object.entries(rolePermissions)) {
            // Find or create the role
            const [roleInstance] = await models.role.findOrCreate({
                where: { name: role }
            });

            for (const permName of perms) {
                // Find the permission
                const permission = await models.permissions.findOne({ where: { name: permName } });
                if (permission) {
                    // Associate the permission with the role via role_permissions
                    await models.role_permissions.findOrCreate({
                        where: { role: roleInstance.name, permission_id: permission.id }
                    });
                }
            }
        }

        logger.info('Role permissions initialized successfully');
    } catch (error) {
        logger.error(`Failed to initialize role permissions: ${error.message}`, { stack: error.stack });
        throw error;
    }
}

/**
 * Retrieves permissions for a specific role
 * @param {string} roleName - Name of the role
 * @param {Object} redisService - Redis service instance
 * @returns {Promise<Array>} - List of permission names
 */
async function getRolePermissions(roleName, redisService) {
    try {
        const cacheKey = `role_permissions:${roleName}`;
        let cachedPermissions = null;

        if (redisService && redisService.enabled) {
            cachedPermissions = await redisService.get(cacheKey);
            if (cachedPermissions) {
                return JSON.parse(cachedPermissions);
            }
        }

        // Find the role
        const role = await models.role.findOne({ where: { name: roleName } });
        if (!role) {
            throw new Error(`Role ${roleName} not found`);
        }

        // Find associated permissions through role_permissions
        const rolePerms = await models.role_permissions.findAll({
            where: { role: role.name },
            attributes: ['permission_id']
        });
        
        // If no permissions are found, return an empty array
        if (!rolePerms || rolePerms.length === 0) {
            return [];
        }
        
        // Get the permission IDs
        const permissionIds = rolePerms.map(rp => rp.permission_id);
        
        // Find the permissions by their IDs
        const permissions = await models.permissions.findAll({
            where: {
                id: permissionIds
            },
            attributes: ['name']
        });
        
        const permNames = permissions.map(p => p.name);

        if (redisService && redisService.enabled) {
            await redisService.set(cacheKey, JSON.stringify(permNames), 3600);
        }

        return permNames;
    } catch (error) {
        logger.error(`Error fetching permissions for role ${roleName}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    initializeRolePermissions,
    getRolePermissions
};