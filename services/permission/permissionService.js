const logger = require('../../utils/logger');
const { sequelize } = require('../../config/sequelize');
const models = require('../../models');
const { NotFoundError, ValidationError } = require('../../errors/CustomErrors');

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
 * Retrieves all permissions
 * @param {Object} redisService - Redis service instance
 * @returns {Promise<Array>} - List of permissions
 */
async function getAllPermissions(redisService) {
    try {
        const cacheKey = 'permissions:all';
        let permissions = null;
ؤ
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

class PermissionService {
    constructor(db, redisService) {
        this.db = db;
        this.redisService = redisService;
        this.Permission = db.permissions;
        this.RolePermission = db.role_permissions;
    }

    /**
     * Initializes permissions in the database and caches them in Redis
     */
    async initializePermissions() {
        try {
            logger.info('Starting permissions initialization');

            // Check if permissions are already cached in Redis
            const cacheKey = 'permissions:all';
            let cachedPermissions = null;

            if (this.redisService?.enabled) {
                cachedPermissions = await this.redisService.get(cacheKey);
                if (cachedPermissions) {
                    logger.info('Permissions loaded from Redis cache');
                    return JSON.parse(cachedPermissions);
                }
            }

            // Create each permission individually
            const createdPermissions = [];

            for (const permission of permissions) {
                const [dbPermission, created] = await this.Permission.findOrCreate({
                    where: { name: permission.name },
                    defaults: permission,
                    individualHooks: true
                });
                createdPermissions.push(dbPermission);
            }

            // Cache permissions in Redis if available
            if (this.redisService?.enabled) {
                await this.redisService.set(cacheKey, JSON.stringify(createdPermissions), 3600); // Cache for 1 hour
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
     * Get all permissions
     * @returns {Promise<Array>} List of permissions
     */
    async getAllPermissions() {
        try {
            const cacheKey = 'permissions:all';
            let permissions = null;

            if (this.redisService?.enabled) {
                permissions = await this.redisService.get(cacheKey);
                if (permissions) {
                    return JSON.parse(permissions);
                }
            }

            permissions = await this.Permission.findAll({
                order: [['group', 'ASC'], ['action', 'ASC'], ['resource', 'ASC']]
            });

            if (this.redisService?.enabled) {
                await this.redisService.set(cacheKey, JSON.stringify(permissions), 3600);
            }

            return permissions;
        } catch (error) {
            logger.error(`Error fetching permissions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new permission
     * @param {Object} permissionData - Permission data
     * @returns {Promise<Object>} Created permission
     */
    async createPermission(permissionData) {
        try {
            const { name, description, group, action, resource, metadata } = permissionData;

            // Check if permission name already exists
            const existingPermission = await this.Permission.findOne({ where: { name } });
            if (existingPermission) {
                throw new ValidationError(`Permission with name '${name}' already exists`);
            }

            // Check if combination of group, action, and resource already exists
            const existingCombination = await this.Permission.findOne({
                where: { group, action, resource }
            });
            if (existingCombination) {
                throw new ValidationError(
                    `Permission with group '${group}', action '${action}', and resource '${resource}' already exists`
                );
            }

            const permission = await this.Permission.create({
                name,
                description,
                group,
                action,
                resource,
                metadata,
                is_system: false,
                deprecated: false
            });

            // Invalidate cache
            if (this.redisService?.enabled) {
                await this.redisService.del('permissions:all');
            }

            return permission;
        } catch (error) {
            logger.error(`Error creating permission: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update an existing permission
     * @param {string} permissionId - Permission ID
     * @param {Object} updateData - Permission update data
     * @returns {Promise<Object>} Updated permission
     */
    async updatePermission(permissionId, updateData) {
        try {
            const permission = await this.Permission.findByPk(permissionId);
            if (!permission) {
                throw new NotFoundError(`Permission with ID '${permissionId}' not found`);
            }

            // Prevent updating system permissions
            if (permission.is_system) {
                throw new ValidationError('Cannot update system permissions');
            }

            // If updating name, check for duplicates
            if (updateData.name && updateData.name !== permission.name) {
                const existingPermission = await this.Permission.findOne({
                    where: { name: updateData.name }
                });
                if (existingPermission) {
                    throw new ValidationError(`Permission with name '${updateData.name}' already exists`);
                }
            }

            // If updating group, action, or resource, check for duplicates
            if ((updateData.group || updateData.action || updateData.resource) &&
                (updateData.group !== permission.group ||
                 updateData.action !== permission.action ||
                 updateData.resource !== permission.resource)) {
                const existingCombination = await this.Permission.findOne({
                    where: {
                        group: updateData.group || permission.group,
                        action: updateData.action || permission.action,
                        resource: updateData.resource || permission.resource,
                        id: { [sequelize.Op.ne]: permissionId }
                    }
                });
                if (existingCombination) {
                    throw new ValidationError(
                        `Permission with this combination of group, action, and resource already exists`
                    );
                }
            }

            await permission.update(updateData);

            // Invalidate cache
            if (this.redisService?.enabled) {
                await this.redisService.del('permissions:all');
                // Invalidate role permissions cache for all roles that have this permission
                const rolePermissions = await this.RolePermission.findAll({
                    where: { permission_id: permissionId },
                    include: [{
                        model: this.db.roles,
                        as: 'role',
                        attributes: ['name']
                    }]
                });
                await Promise.all(rolePermissions.map(rp =>
                    this.redisService.del(`role_permissions:${rp.role.name}`)
                ));
            }

            return permission;
        } catch (error) {
            logger.error(`Error updating permission: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete a permission
     * @param {string} permissionId - Permission ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deletePermission(permissionId) {
        try {
            const permission = await this.Permission.findByPk(permissionId);
            if (!permission) {
                throw new NotFoundError(`Permission with ID '${permissionId}' not found`);
            }

            // Prevent deleting system permissions
            if (permission.is_system) {
                throw new ValidationError('Cannot delete system permissions');
            }

            // Check if permission is assigned to any roles
            const roleCount = await this.RolePermission.count({
                where: { permission_id: permissionId }
            });
            if (roleCount > 0) {
                throw new ValidationError(
                    `Cannot delete permission that is assigned to ${roleCount} roles`
                );
            }

            await permission.destroy();

            // Invalidate cache
            if (this.redisService?.enabled) {
                await this.redisService.del('permissions:all');
            }

            return true;
        } catch (error) {
            logger.error(`Error deleting permission: ${error.message}`);
            throw error;
        }
    }

    /**
     * Mark a permission as deprecated
     * @param {string} permissionId - Permission ID
     * @param {string} reason - Reason for deprecation
     * @returns {Promise<Object>} Updated permission
     */
    async deprecatePermission(permissionId, reason) {
        try {
            const permission = await this.Permission.findByPk(permissionId);
            if (!permission) {
                throw new NotFoundError(`Permission with ID '${permissionId}' not found`);
            }

            // Prevent deprecating system permissions
            if (permission.is_system) {
                throw new ValidationError('Cannot deprecate system permissions');
            }

            await permission.update({
                deprecated: true,
                deprecated_reason: reason
            });

            // Invalidate cache
            if (this.redisService?.enabled) {
                await this.redisService.del('permissions:all');
                // Invalidate role permissions cache for all roles that have this permission
                const rolePermissions = await this.RolePermission.findAll({
                    where: { permission_id: permissionId },
                    include: [{
                        model: this.db.roles,
                        as: 'role',
                        attributes: ['name']
                    }]
                });
                await Promise.all(rolePermissions.map(rp =>
                    this.redisService.del(`role_permissions:${rp.role.name}`)
                ));
            }

            return permission;
        } catch (error) {
            logger.error(`Error deprecating permission: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get permissions by group
     * @param {string} group - Permission group
     * @returns {Promise<Array>} List of permissions in the group
     */
    async getPermissionsByGroup(group) {
        try {
            const cacheKey = `permissions:group:${group}`;
            let permissions = null;

            if (this.redisService?.enabled) {
                permissions = await this.redisService.get(cacheKey);
                if (permissions) {
                    return JSON.parse(permissions);
                }
            }

            permissions = await this.Permission.findAll({
                where: { group },
                order: [['action', 'ASC'], ['resource', 'ASC']]
            });

            if (this.redisService?.enabled) {
                await this.redisService.set(cacheKey, JSON.stringify(permissions), 3600);
            }

            return permissions;
        } catch (error) {
            logger.error(`Error fetching permissions by group: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PermissionService;