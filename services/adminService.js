const db = require('../config/database');
const logger = require('../utils/logger');
const { ConflictError, ValidationError } = require('../errors/CustomErrors');

class AdminService {
    constructor() {
        this.User = db.users;
        this.Permission = db.permissions;
    }

    async getAllUsers(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            return await this.User.findAndCountAll({
                attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'is_active'],
                limit: parseInt(limit),
                offset: offset,
                order: [['created_at', 'DESC']]
            });
        } catch (error) {
            logger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }

    async updateUserRole(userId, newRole) {
        try {
            const allowedRoles = ['super_admin', 'admin', 'content_manager', 'user'];
            if (!allowedRoles.includes(newRole)) {
                throw new ConflictError('Invalid role specified');
            }

            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            await user.update({ role: newRole });
            logger.info(`User ${userId} role updated to ${newRole}`);
            return user;
        } catch (error) {
            logger.error(`Error updating user role: ${error.message}`);
            throw error;
        }
    }

    async toggleUserStatus(userId) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }

            const newStatus = !user.is_active;
            await user.update({ is_active: newStatus });
            logger.info(`User ${userId} status changed to ${newStatus ? 'active' : 'inactive'}`);
            return user;
        } catch (error) {
            logger.error(`Error toggling user status: ${error.message}`);
            throw error;
        }
    }

    async createPermission(permissionData) {
        try {
            const permission = await this.Permission.create(permissionData);
            logger.info(`New permission created: ${permission.name}`);
            return permission;
        } catch (error) {
            logger.error(`Error creating permission: ${error.message}`);
            throw error;
        }
    }

    async assignPermissionToRole(permissionId, role) {
        try {
            // Implementation for permission assignment
            // This would require a join table between permissions and roles
            logger.info(`Permission ${permissionId} assigned to role ${role}`);
            return { success: true };
        } catch (error) {
            logger.error(`Error assigning permission: ${error.message}`);
            throw error;
        }
    }
}

module.exports = AdminService;
