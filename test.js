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
                    throw new ConflictError('User with the same email or username already exists');
                }

                const hasPermission = await this.roleService.checkRolePermission(
                    createdBy.role,
                    PERMISSIONS.ADMIN_MANAGEMENT.CREATE_ADMIN
                );

                if (!hasPermission) {
                    throw new ForbiddenError('You do not have permission to create admins');
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

    /**
     * Update admin data
     */
    async updateAdmin(adminId, updateData, updatedBy) {
        return withTransaction(this.db, async (transaction) => {
            try {
                this.validateAdminData(updateData, true);
                if (updateData.role_id) {
                    await this.validateAdminRole(updateData.role_id, transaction);
                }

                const admin = await this.db.users.findByPk(adminId, {
                    include: [{ model: this.db.roles, attributes: ['name', 'description'] }],
                    transaction
                });

                if (!admin || !admin.is_admin) {
                    throw new NotFoundError('Admin not found');
                }

                const hasPermission = await this.roleService.checkRolePermission(
                    updatedBy.role,
                    PERMISSIONS.ADMIN_MANAGEMENT.EDIT_ADMIN
                );

                if (!hasPermission) {
                    throw new ForbiddenError('You do not have permission to update admin data');
                }

                if (admin.role?.name === 'super_admin' && updatedBy.role !== 'super_admin') {
                    throw new ForbiddenError('Only a super admin can update another super admin');
                }

                if (updateData.email || updateData.username) {
                    const existingUser = await this.db.users.findOne({
                        where: {
                            [this.db.Sequelize.Op.and]: [
                                {
                                    [this.db.Sequelize.Op.or]: [
                                        { email: updateData.email || admin.email },
                                        { username: updateData.username || admin.username }
                                    ]
                                },
                                { id: { [this.db.Sequelize.Op.ne]: adminId } }
                            ]
                        },
                        transaction
                    });

                    if (existingUser) {
                        throw new ConflictError('Another user with the same email or username already exists');
                    }
                }

                if (updateData.password) {
                    updateData.password = await bcrypt.hash(updateData.password, 10);
                }

                await admin.update(updateData, { transaction });

                await this.auditService.logAction(updatedBy.id, 'UPDATE_ADMIN', {
                    admin_id: admin.id,
                    updated_fields: Object.keys(updateData)
                }, transaction);

                await this.invalidateAdminCache(admin.id);

                const updatedAdmin = await this.db.users.findByPk(adminId, {
                    include: [{ model: this.db.roles, attributes: ['name', 'description'] }],
                    transaction
                });

                const { password, ...adminWithoutPassword } = updatedAdmin.toJSON();
                return adminWithoutPassword;
            } catch (error) {
                logger.error(`Error in updateAdmin: ${error.message}`, { stack: error.stack });
                throw error;
            }
        });
    }

    /**
     * Delete an admin
     */
    async deleteAdmin(adminId, deletedBy) {
        return withTransaction(this.db, async (transaction) => {
            try {
                const admin = await this.db.users.findByPk(adminId, {
                    include: [{ model: this.db.roles, attributes: ['name'] }],
                    transaction
                });

                if (!admin || !admin.is_admin) {
                    throw new NotFoundError('Admin not found');
                }

                const hasPermission = await this.roleService.checkRolePermission(
                    deletedBy.role,
                    PERMISSIONS.ADMIN_MANAGEMENT.DELETE_ADMIN
                );

                if (!hasPermission) {
                    throw new ForbiddenError('You do not have permission to delete admins');
                }

                if (admin.role?.name === 'super_admin') {
                    throw new ForbiddenError('Cannot delete a super admin');
                }

                if (admin.id === deletedBy.id) {
                    throw new ValidationError('An admin cannot delete themselves');
                }

                await admin.destroy({ transaction });

                await this.auditService.logAction(deletedBy.id, 'DELETE_ADMIN', {
                    admin_id: admin.id,
                    admin_email: admin.email
                }, transaction);

                await this.invalidateAdminCache(admin.id);

                return true;
            } catch (error) {
                logger.error(`Error in deleteAdmin: ${error.message}`, { stack: error.stack });
                throw error;
            }
        });
    }

    /**
     * Toggle admin status
     */
    async toggleAdminStatus(adminId, updatedBy) {
        return withTransaction(this.db, async (transaction) => {
            try {
                const admin = await this.db.users.findByPk(adminId, {
                    include: [{ model: this.db.roles, attributes: ['name'] }],
                    transaction
                });

                if (!admin || !admin.is_admin) {
                    throw new NotFoundError('Admin not found');
                }

                const hasPermission = await this.roleService.checkRolePermission(
                    updatedBy.role,
                    PERMISSIONS.ADMIN_MANAGEMENT.MANAGE_ADMIN_STATUS
                );

                if (!hasPermission) {
                    throw new ForbiddenError('You do not have permission to manage admin status');
                }

                if (admin.role?.name === 'super_admin') {
                    throw new ForbiddenError('Cannot deactivate a super admin');
                }

                if (admin.id === updatedBy.id) {
                    throw new ValidationError('An admin cannot deactivate themselves');
                }

                await admin.update({ is_active: !admin.is_active }, { transaction });

                await this.auditService.logAction(updatedBy.id, 'TOGGLE_ADMIN_STATUS', {
                    admin_id: admin.id,
                    new_status: !admin.is_active
                }, transaction);

                await this.invalidateAdminCache(admin.id);

                return {
                    id: admin.id,
                    is_active: !admin.is_active
                };
            } catch (error) {
                logger.error(`Error in toggleAdminStatus: ${error.message}`, { stack: error.stack });
                throw error;
            }
        });
    }

    /**
     * Create the first super admin
     */
    async createFirstSuperAdmin(adminData) {
        return withTransaction(this.db, async (transaction) => {
            try {
                this.validateAdminData(adminData);

                const superAdminExists = await this.checkSuperAdminExists();
                if (superAdminExists) {
                    throw new ValidationError('A super admin already exists in the system');
                }

                const superAdminRole = await this.db.roles.findOne({
                    where: { name: 'super_admin' },
                    transaction
                });

                if (!superAdminRole) {
                    throw new NotFoundError('Super admin role not found');
                }

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
                    throw new ConflictError('User with the same email or username already exists');
                }

                const hashedPassword = await bcrypt.hash(adminData.password, 10);
                const superAdmin = await this.db.users.create({
                    first_name: adminData.first_name,
                    last_name: adminData.last_name,
                    email: adminData.email,
                    username: adminData.username,
                    password: hashedPassword,
                    role_id: superAdminRole.id,
                    is_active: true,
                    is_admin: true
                }, { transaction });

                await this.invalidateAdminCache(superAdmin.id);

                const { password, ...adminWithoutPassword } = superAdmin.toJSON();
                return adminWithoutPassword;
            } catch (error) {
                logger.error(`Error in createFirstSuperAdmin: ${error.message}`, { stack: error.stack });
                throw error;
            }
        });
    }
}

module.exports = AdminService;