const logger = require('../../utils/logger');
const { ValidationError } = require('../../errors/CustomErrors');

class RolePermissionController {
    constructor({ roleService, permissionService, sequelize }) {
        this.roleService = roleService;
        this.permissionService = permissionService;
        this.sequelize = sequelize;
    }

    /**
     * الحصول على كافة الأدوار
     */
    getAllRoles = async (req, res) => {
        try {
            const roles = await this.roleService.getAllRoles();
            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            logger.error(`Error in getAllRoles controller: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch roles',
                error: error.message
            });
        }
    };

    /**
     * إنشاء دور جديد
     */
    createRole = async (req, res) => {
        try {
            const role = await this.roleService.createRole(req.body);
            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: role
            });
        } catch (error) {
            logger.error(`Error in createRole controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * تحديث دور محدد
     */
    updateRole = async (req, res) => {
        try {
            const role = await this.roleService.updateRole(req.params.id, req.body);
            res.json({
                success: true,
                message: 'Role updated successfully',
                data: role
            });
        } catch (error) {
            logger.error(`Error in updateRole controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * حذف دور محدد
     */
    deleteRole = async (req, res) => {
        try {
            await this.roleService.deleteRole(req.params.id);
            res.json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            logger.error(`Error in deleteRole controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * الحصول على كافة الصلاحيات
     */
    getAllPermissions = async (req, res) => {
        try {
            const permissions = await this.permissionService.getAllPermissions();
            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            logger.error(`Error in getAllPermissions controller: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch permissions',
                error: error.message
            });
        }
    };

    /**
     * إنشاء صلاحية جديدة
     */
    createPermission = async (req, res) => {
        try {
            const permission = await this.permissionService.createPermission(req.body);
            res.status(201).json({
                success: true,
                message: 'Permission created successfully',
                data: permission
            });
        } catch (error) {
            logger.error(`Error in createPermission controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * تحديث صلاحية محددة
     */
    updatePermission = async (req, res) => {
        try {
            const permission = await this.permissionService.updatePermission(req.params.id, req.body);
            res.json({
                success: true,
                message: 'Permission updated successfully',
                data: permission
            });
        } catch (error) {
            logger.error(`Error in updatePermission controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * حذف صلاحية محددة
     */
    deletePermission = async (req, res) => {
        try {
            await this.permissionService.deletePermission(req.params.id);
            res.json({
                success: true,
                message: 'Permission deleted successfully'
            });
        } catch (error) {
            logger.error(`Error in deletePermission controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * تعيين صلاحيات لدور محدد
     */
    assignPermissionsToRole = async (req, res) => {
        try {
            const result = await this.roleService.assignPermissionsToRole(req.params.roleId, req.body.permissionIds);
            res.json({
                success: true,
                message: 'Permissions assigned successfully',
                data: result
            });
        } catch (error) {
            logger.error(`Error in assignPermissionsToRole controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * إزالة صلاحية من دور محدد
     */
    removePermissionFromRole = async (req, res) => {
        try {
            await this.roleService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
            res.json({
                success: true,
                message: 'Permission removed successfully'
            });
        } catch (error) {
            logger.error(`Error in removePermissionFromRole controller: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * إصلاح الأدوار المكررة
     */
    fixDuplicateRoles = async (req, res) => {
        try {
            const sequelize = this.container.getDb().sequelize;
            
            // Start a transaction
            const transaction = await sequelize.transaction();
            
            try {
                // Find the SUPER_ADMIN role (uppercase)
                const upperCaseRoles = await sequelize.query(
                    `SELECT id FROM "roles" WHERE name = 'SUPER_ADMIN'`,
                    { type: sequelize.QueryTypes.SELECT, transaction }
                );
                
                // Find the super_admin role (lowercase)
                const lowerCaseRoles = await sequelize.query(
                    `SELECT id FROM "roles" WHERE name = 'super_admin'`,
                    { type: sequelize.QueryTypes.SELECT, transaction }
                );
                
                const results = {
                    upperCaseRole: upperCaseRoles.length > 0 ? upperCaseRoles[0] : null,
                    lowerCaseRole: lowerCaseRoles.length > 0 ? lowerCaseRoles[0] : null,
                    usersUpdated: 0,
                    permissionsDeleted: 0,
                    roleDeleted: false
                };
                
                if (results.upperCaseRole && results.lowerCaseRole) {
                    const upperCaseRoleId = results.upperCaseRole.id;
                    const lowerCaseRoleId = results.lowerCaseRole.id;
                    
                    logger.info(`Found duplicate roles: SUPER_ADMIN (${upperCaseRoleId}) and super_admin (${lowerCaseRoleId})`);
                    
                    // Update users from uppercase to lowercase role
                    const [usersResult] = await sequelize.query(
                        `UPDATE "users" SET role_id = :newRoleId WHERE role_id = :oldRoleId`,
                        {
                            replacements: { 
                                newRoleId: lowerCaseRoleId,
                                oldRoleId: upperCaseRoleId
                            },
                            transaction
                        }
                    );
                    
                    results.usersUpdated = usersResult ? usersResult.rowCount : 0;
                    logger.info(`Updated ${results.usersUpdated} users from SUPER_ADMIN to super_admin role`);
                    
                    // Delete role permissions for uppercase role
                    const [permissionsResult] = await sequelize.query(
                        `DELETE FROM "role_permissions" WHERE role_id = :roleId`,
                        {
                            replacements: { roleId: upperCaseRoleId },
                            transaction
                        }
                    );
                    
                    results.permissionsDeleted = permissionsResult ? permissionsResult.rowCount : 0;
                    logger.info(`Deleted ${results.permissionsDeleted} permissions for SUPER_ADMIN role`);
                    
                    // Delete the uppercase role
                    await sequelize.query(
                        `DELETE FROM "roles" WHERE id = :roleId`,
                        {
                            replacements: { roleId: upperCaseRoleId },
                            transaction
                        }
                    );
                    
                    results.roleDeleted = true;
                    logger.info('Successfully deleted SUPER_ADMIN role');
                } else {
                    logger.info('No duplicate roles found or one of the roles is missing');
                }
                
                await transaction.commit();
                logger.info('Transaction committed successfully');
                
                // Return success with details
                return res.status(200).json({
                    success: true,
                    message: 'Successfully fixed duplicate roles',
                    details: results
                });
            } catch (error) {
                await transaction.rollback();
                logger.error(`Error in transaction: ${error.message}`, { stack: error.stack });
                throw error;
            }
        } catch (error) {
            logger.error(`Failed to fix duplicate roles: ${error.message}`, { stack: error.stack });
            
            return res.status(500).json({
                success: false,
                message: 'Failed to fix duplicate roles',
                error: error.message
            });
        }
    };
}

module.exports = RolePermissionController;
