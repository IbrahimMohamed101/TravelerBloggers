const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');
const { withTransaction } = require('../../utils/withTransaction');
const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../../errors/CustomErrors');
const { PERMISSIONS } = require('../../constants/permissions');
const { validateEmail, validatePassword } = require('../../utils/validators');



class AdminService {    constructor({ db, sequelize, redisService, roleService, auditService, logger }) {
        this.db = db;
        this.sequelize = sequelize;
        this.userModel = db.users;
        this.roleModel = db.roles;
        this.permissionModel = db.permissions;
        this.redisService = redisService;
        this.roleService = roleService;
        this.auditService = auditService;
        this.logger = logger || console;
    }

    /**
     * Get the admin role ID
     */
    async getAdminRoleId(transaction) {
        const adminRole = await this.roleModel.findOne({
            where: { name: 'admin' },
            transaction
        });
        if (!adminRole) {
            throw new Error('Admin role not found. Please ensure roles are properly initialized.');
        }
        return adminRole.id;
    }

    /**
     * Validate admin data
     */    validateAdminData(adminData, isUpdate = false) {
        if (!isUpdate) {
            if (!adminData.first_name || !adminData.email || !adminData.password) {
                throw new ValidationError('Fields first_name, email, and password are required');
            }
            if (!validateEmail(adminData.email)) {
                throw new ValidationError('Invalid email address');
            }
            if (!validatePassword(adminData.password)) {
                throw new ValidationError('Password must be at least 8 characters long and meet complexity requirements');
            }
        } else {
            if (adminData.email && !validateEmail(adminData.email)) {
                throw new ValidationError('Invalid email address');
            }
            if (adminData.password && !validatePassword(adminData.password)) {
                throw new ValidationError('Password must be at least 8 characters long and contain letters and numbers');
            }
        }
    }
    
    /**
     * Validate that the role is an admin role
     */    async validateAdminRole(roleName, transaction) {
        const role = await this.roleModel.findOne({
            where: { name: roleName },
            transaction
        });
        if (!role || !['super_admin', 'admin'].includes(role.name)) {
            throw new ValidationError('Must assign a valid admin role (admin or super_admin)');
        }
        return role;
    }

    /**
     * Invalidate admin cache
     */
    async invalidateAdminCache(adminId = null) {
        try {
            await this.redisService.del('admin:list');
            if (adminId) {
                await this.redisService.del(`admin:${adminId}`);
            }
        } catch (error) {
            logger.error('Error invalidating admin cache:', error);
        }
    }
    /**
     * Create a new admin
     */
    async createAdmin(adminData, createdById = null) {
        if (!this.sequelize) {
            throw new Error('Database not initialized');
        }

        return withTransaction(this.sequelize, async (transaction) => {
            try {
                this.validateAdminData(adminData);

                const existingUser = await this.userModel.findOne({
                    where: { email: adminData.email },
                    transaction
                });
                
                if (existingUser) {
                    throw new ConflictError('Email already exists');
                }

                // Generate username from email if not provided
                const username = adminData.username || adminData.email.split('@')[0];

                // Check if username already exists
                const existingUsername = await this.userModel.findOne({
                    where: { username },
                    transaction
                });

                if (existingUsername) {
                    throw new ConflictError('Username already exists');
                }

                // Validate and use provided roleId if available, else get default admin role id
                let roleIdToUse;
                if (adminData.roleId) {
                    const role = await this.validateAdminRole(adminData.roleId, transaction);
                    roleIdToUse = role.id;
                } else {
                    roleIdToUse = await this.getAdminRoleId(transaction);
                }

                const hashedPassword = await bcrypt.hash(adminData.password, 10);
                const admin = await this.userModel.create({
                    first_name: adminData.first_name,
                    last_name: adminData.last_name || adminData.first_name, // Use first_name as last_name if not provided
                    username,
                    email: adminData.email,
                    password: hashedPassword,
                    role_id: roleIdToUse,
                    status: 'active'
                }, { transaction });

                if (this.auditService && createdById) {
                    await this.auditService.logAction(createdById, 'CREATE_ADMIN', {
                        admin_id: admin.id,
                        admin_email: admin.email
                    }, transaction);
                }

                await this.invalidateAdminCache(admin.id);
                const adminJson = admin.toJSON();
                const { password, ...adminWithoutPassword } = adminJson;
                return adminWithoutPassword;
            } catch (error) {
                this.logger.error(`Error in createAdmin: ${error.message}`, { stack: error.stack });
                throw error;
            }
        });
    }
}

module.exports = AdminService;
