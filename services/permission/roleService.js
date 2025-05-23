const logger = require('../../utils/logger');
const { DEFAULT_ROLES } = require('../../constants/permissions');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../errors/CustomErrors');
const sequelize = require('../../config/sequelize');

const models = require('../../models');

class RoleService {
    constructor(db, redisService) {
        this.db = db || models;
        this.redisService = redisService;
        this.auditService = null; // Will be set later when audit service is available
    }

    // Method to set audit service after initialization
    setAuditService(auditService) {
        this.auditService = auditService;
    }

    /**
     * Initializes role permissions in the database
     */
    async initializeRolePermissions() {
        try {
            logger.info('Starting role permissions initialization');

            for (const roleData of Object.values(DEFAULT_ROLES)) {
                // Find or create the role
                const [roleInstance] = await this.db.roles.findOrCreate({
                    where: { name: roleData.name },
                    defaults: {
                        name: roleData.name,
                        description: roleData.description
                    }
                });

                // Process each permission for the role
                for (const permissionName of roleData.permissions) {
                    // Find the permission
                    const permission = await this.db.permissions.findOne({ 
                        where: { name: permissionName }
                    });
                    
                    if (permission) {
                        try {
                            // استخدام استعلام مباشر بدلاً من النموذج
                            await this.db.sequelize.query(`
                                INSERT INTO "public"."role_permissions" (id, role_id, permission_id, "createdAt", "updatedAt")
                                VALUES (uuid_generate_v4(), '${roleInstance.id}', '${permission.id}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                                ON CONFLICT (role_id, permission_id) DO NOTHING;
                            `);
                            logger.info(`Associated role ${roleData.name} with permission ${permissionName}`);
                        } catch (error) {
                            logger.error(`Error associating role ${roleData.name} with permission ${permissionName}: ${error.message}`);
                        }
                    } else {
                        logger.warn(`Permission not found: ${permissionName}`);
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
     * تهيئة الأدوار الافتراضية في النظام
     */
    async initializeRoles() {
        try {
            const transaction = await this.db.sequelize.transaction();

            try {
                // إنشاء الأدوار الافتراضية
                for (const role of Object.values(DEFAULT_ROLES)) {
                    const [createdRole, created] = await this.db.roles.findOrCreate({
                        where: { name: role.name },
                        defaults: {
                            name: role.name,
                            description: role.description
                        },
                        transaction
                    });

                    if (created) {
                        logger.info(`Created default role: ${role.name}`);
                    }

                    // إنشاء الصلاحيات المرتبطة بالدور
                    for (const permissionName of role.permissions) {
                        const [permission, created] = await this.db.permissions.findOrCreate({
                            where: { name: permissionName },
                            defaults: { name: permissionName },
                            transaction
                        });

                        if (created) {
                            logger.info(`Created permission: ${permissionName}`);
                        }

                        // ربط الصلاحية بالدور
                        await this.db.rolePermissions.findOrCreate({
                            where: {
                                role_id: createdRole.id,
                                permission_id: permission.id
                            },
                            defaults: {
                                role_id: createdRole.id,
                                permission_id: permission.id
                            },
                            transaction
                        });
                    }
                }

                await transaction.commit();
                logger.info('Successfully initialized default roles and permissions');
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            logger.error(`Error initializing roles: ${error.message}`);
            throw error;
        }
    }

    /**
     * الحصول على جميع الأدوار
     */
    async getAllRoles() {
        try {
            const roles = await this.db.roles.findAll({
                include: [{
                    model: this.db.permissions,
                    as: 'permissions',
                    through: { attributes: [] }
                }],
                order: [['createdAt', 'DESC']]
            });

            return roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions.map(p => p.name),
                created_at: role.createdAt,
                updated_at: role.updatedAt
            }));
        } catch (error) {
            logger.error(`Error getting roles: ${error.message}`);
            throw error;
        }
    }

    /**
     * الحصول على دور محدد
     */
    async getRole(roleId) {
        try {
            const role = await this.db.roles.findByPk(roleId, {
                include: [{
                    model: this.db.permissions,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            });

            if (!role) {
                throw new NotFoundError('الدور غير موجود');
            }

            return {
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions.map(p => p.name),
                created_at: role.createdAt,
                updated_at: role.updatedAt
            };
        } catch (error) {
            logger.error(`Error getting role: ${error.message}`);
            throw error;
        }
    }

    /**
     * إنشاء دور جديد
     */
    async createRole(roleData, adminId) {
        const transaction = await this.db.sequelize.transaction();

        try {
            // التحقق من عدم وجود دور بنفس الاسم
            const existingRole = await this.db.roles.findOne({
                where: { name: roleData.name },
                transaction
            });

            if (existingRole) {
                throw new ConflictError('يوجد دور بنفس الاسم');
            }

            // إنشاء الدور
            const role = await this.db.roles.create({
                name: roleData.name,
                description: roleData.description
            }, { transaction });

            // إضافة الصلاحيات للدور
            if (roleData.permissions && roleData.permissions.length > 0) {
                for (const permissionName of roleData.permissions) {
                    const [permission] = await this.db.permissions.findOrCreate({
                        where: { name: permissionName },
                        defaults: { name: permissionName },
                        transaction
                    });

                        await this.db.rolePermissions.create({
                            role: role.name,
                            permission_id: permission.id
                        }, { transaction });
                }
            }

            await transaction.commit();

            // تسجيل العملية
            await this.auditService.logAction(adminId, 'CREATE_ROLE', {
                role_id: role.id,
                role_name: role.name,
                permissions: roleData.permissions
            });

            return this.getRole(role.id);
        } catch (error) {
            await transaction.rollback();
            logger.error(`Error creating role: ${error.message}`);
            throw error;
        }
    }

    /**
     * تحديث دور موجود
     */
    async updateRole(roleId, roleData, adminId) {
        const transaction = await this.db.sequelize.transaction();

        try {
            const role = await this.db.roles.findByPk(roleId, { transaction });

            if (!role) {
                throw new NotFoundError('الدور غير موجود');
            }

            // لا يمكن تعديل دور المشرف الرئيسي
            if (role.name === 'super_admin') {
                throw new ForbiddenError('لا يمكن تعديل دور المشرف الرئيسي');
            }

            // التحقق من عدم وجود دور آخر بنفس الاسم
            if (roleData.name && roleData.name !== role.name) {
                const existingRole = await this.db.roles.findOne({
                    where: { name: roleData.name },
                    transaction
                });

                if (existingRole) {
                    throw new ConflictError('يوجد دور بنفس الاسم');
                }
            }

            // تحديث بيانات الدور
            await role.update({
                name: roleData.name || role.name,
                description: roleData.description || role.description
            }, { transaction });

            // تحديث الصلاحيات
            if (roleData.permissions) {
                // حذف الصلاحيات القديمة
                await this.db.rolePermissions.destroy({
                    where: { role_id: role.id },
                    transaction
                });

                // إضافة الصلاحيات الجديدة
                for (const permissionName of roleData.permissions) {
                    const [permission] = await this.db.permissions.findOrCreate({
                        where: { name: permissionName },
                        defaults: { name: permissionName },
                        transaction
                    });

                await this.db.rolePermissions.create({
                    role: role.name,
                    permission_id: permission.id
                }, { transaction });
                }
            }

            await transaction.commit();

            // تسجيل العملية
            await this.auditService.logAction(adminId, 'UPDATE_ROLE', {
                role_id: role.id,
                role_name: role.name,
                old_permissions: role.permissions?.map(p => p.name),
                new_permissions: roleData.permissions
            });

            return this.getRole(role.id);
        } catch (error) {
            await transaction.rollback();
            logger.error(`Error updating role: ${error.message}`);
            throw error;
        }
    }

    /**
     * حذف دور
     */
    async deleteRole(roleId, adminId) {
        const transaction = await this.db.sequelize.transaction();

        try {
            const role = await this.db.roles.findByPk(roleId, { transaction });

            if (!role) {
                throw new NotFoundError('الدور غير موجود');
            }

            // لا يمكن حذف دور المشرف الرئيسي
            if (role.name === 'super_admin') {
                throw new ForbiddenError('لا يمكن حذف دور المشرف الرئيسي');
            }

            // التحقق من عدم وجود مستخدمين بهذا الدور
            const usersWithRole = await this.db.users.count({
                where: { role_id: role.id },
                transaction
            });

            if (usersWithRole > 0) {
                throw new ConflictError('لا يمكن حذف الدور لوجود مستخدمين به');
            }

            // حذف الصلاحيات المرتبطة بالدور
            await this.db.rolePermissions.destroy({
                where: { role_id: role.id },
                transaction
            });

            // حذف الدور
            await role.destroy({ transaction });

            await transaction.commit();

            // تسجيل العملية
            await this.auditService.logAction(adminId, 'DELETE_ROLE', {
                role_id: role.id,
                role_name: role.name
            });

            return true;
        } catch (error) {
            await transaction.rollback();
            logger.error(`Error deleting role: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get permissions for a specific role
     * @param {string} roleName - Name of the role
     * @returns {Promise<Array>} List of permission names
     */
    async getRolePermissions(roleName) {
        try {
            const cacheKey = `role_permissions:${roleName}`;
            let permissions = null;

            if (this.redisService?.enabled) {
                permissions = await this.redisService.get(cacheKey);
                if (permissions) {
                    return JSON.parse(permissions);
                }
            }

            // Usar consulta SQL directa para obtener los permisos del rol
            const query = `
                SELECT p.name 
                FROM "public"."role_permissions" rp
                JOIN "public"."roles" r ON rp.role_id = r.id
                JOIN "public"."permissions" p ON rp.permission_id = p.id
                WHERE r.name = :roleName
            `;
            
            const rolePermissions = await sequelize.query(query, {
                replacements: { roleName },
                type: sequelize.QueryTypes.SELECT
            });

            if (!rolePermissions || rolePermissions.length === 0) {
                logger.warn(`No permissions found for role: ${roleName}`);
                return [];
            }

            // Extract permission names (SQL ya devuelve directamente los nombres)
            const permissionNames = rolePermissions.map(rp => rp.name);

            // Cache the results
            if (this.redisService?.enabled) {
                await this.redisService.set(cacheKey, JSON.stringify(permissionNames), 3600); // Cache for 1 hour
            }

            return permissionNames;
        } catch (error) {
            logger.error(`Error getting role permissions: ${error.message}`);
            throw error;
        }
    }

    /**
     * التحقق من صلاحية محددة لدور معين
     */
    async checkRolePermission(roleName, permissionName) {
        try {
            const role = await this.db.roles.findOne({
                where: { name: roleName },
                include: [{
                    model: this.db.permissions,
                    as: 'permissions',
                    where: { name: permissionName },
                    through: { attributes: [] }
                }]
            });

            return !!role;
        } catch (error) {
            logger.error(`Error checking role permission: ${error.message}`);
            throw error;
        }
    }
}

module.exports = RoleService;