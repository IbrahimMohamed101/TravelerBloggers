const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');
const withTransaction = require('../../utils/withTransaction');
const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../../errors/CustomErrors');
const { PERMISSIONS } = require('../../constants/permissions');
const { validateEmail, validatePassword } = require('../../utils/validators');


class AdminService {
    constructor(container) {
        this.container = container;
        this.db = container.getDb();
        this.redisService = container.getService('redisService');
        this.roleService = container.getService('roleService');
        this.auditService = container.getService('auditService');
    }

/**
     * Validate admin data
     */
    validateAdminData(adminData, isUpdate = false) {
        if (!isUpdate) {
            if (!adminData.first_name || !adminData.last_name || !adminData.username || !adminData.role_id) {
                throw new ValidationError('Fields first_name, last_name, username, role_id are required');
            }
            if (!adminData.email || !validateEmail(adminData.email)) {
                throw new ValidationError('Invalid email address');
            }
            if (!adminData.password || !validatePassword(adminData.password)) {
                throw new ValidationError('Password must be at least 8 characters long and contain letters and numbers');
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
     */
    async validateAdminRole(roleId, transaction) {
        const role = await this.db.roles.findByPk(roleId, { transaction });
        if (!role || !['super_admin', 'admin'].includes(role.name)) {
            throw new ValidationError('Must assign a valid admin role');
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
    async createAdmin(adminData, createdBy) {
        return withTransaction(this.db, async (transaction) => {
            try {
                this.validateAdminData(adminData);
                await this.validateAdminRole(adminData.role_id, transaction);

                const existingUser = await this.db.users.findOne({
                    where: {
                        [this.db.Sequelize.Op.or]: [
                            { email: adminData.email },
                            { username: adminData.username }
                        ]
                    },
                    transaction
                });
                if (existingUser) {
                    throw new ConflictError('Email or username already exists');
                }
                const hasPermission = await this.roleService.checkRolePermission(
                    createdBy.role,
                    PERMISSIONS.ADMIN_MANAGEMENT.CREATE_ADMIN
                );
                if (!hasPermission) {
                    throw new ForbiddenError('You do not have permission to create an admin');
                }

                const hashedPassword = await bcrypt.hash(adminData.password, 10);
                const admin = await this.db.users.create({
                    first_name: adminData.first_name,
                    last_name: adminData.last_name,
                    email: adminData.email,
                    username: adminData.username,
                    password: hashedPassword,
                    role_id: adminData.role_id,
                    is_active: true,
                    is_admin: true
                }, { transaction });

                await this.auditService.logAction(createdBy.id, 'CREATE_ADMIN', {
                    admin_id: admin.id,
                    admin_email: admin.email,
                    role_id: adminData.role_id
                }, transaction);

                await this.invalidateAdminCache(admin.id);
                const { password, ...adminWithoutPassword } = admin.toJSON();
                return adminWithoutPassword;
            } catch (error) {
                logger.error(`Error in createAdmin: ${error.message}`, { stack: error.stack });
                throw error;
            }
        });
    }

    
}
