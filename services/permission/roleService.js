// services/roleService.js
const sequelize = require('../../config/sequelize');

async function initializeRolePermissions() {
    const rolePermissions = {
        super_admin: ['create_blog', 'edit_blog', 'delete_blog', 'manage_users', 'moderate_content'],
        admin: ['manage_users', 'moderate_content'],
        content_manager: ['create_blog', 'edit_blog', 'moderate_content'],
        blogger: ['create_blog', 'edit_blog'],
        user: []
    };
    for (const [role, perms] of Object.entries(rolePermissions)) {
        for (const permName of perms) {
            const permission = await sequelize.models.permissions.findOne({ where: { name: permName } });
            if (permission) {
                await sequelize.models.role_permissions.findOrCreate({
                    where: { role, permission_id: permission.id }
                });
            }
        }
    }
}

module.exports = { initializeRolePermissions };
