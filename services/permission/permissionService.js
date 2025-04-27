// services/permissionService.js
const sequelize = require('../../config/sequelize');

async function initializePermissions() {
  const permissions = [
    { name: 'create_blog', description: 'Create a new blog' },
    { name: 'edit_blog', description: 'Edit existing blogs' },
    { name: 'delete_blog', description: 'Delete blogs' },
    { name: 'manage_users', description: 'Manage user accounts' },
    { name: 'moderate_content', description: 'Moderate blogs and posts' }
  ];
  for (const perm of permissions) {
    await sequelize.models.permissions.findOrCreate({
      where: { name: perm.name },
      defaults: perm
    });
  }
}

module.exports = { initializePermissions };
