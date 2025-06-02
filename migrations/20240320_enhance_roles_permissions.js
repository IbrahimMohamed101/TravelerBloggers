'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Start transaction
    const transaction = await queryInterface.sequelize.transaction();

    try {      // 1. Modify roles table
      // Skip adding 'level' column as it's already added in base tables migration
      
      await queryInterface.addColumn('roles', 'parent_role_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id'
        },
        comment: 'Reference to parent role for role inheritance'
      }, { transaction });

      await queryInterface.addColumn('roles', 'is_system', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if this is a system role that cannot be deleted'
      }, { transaction });

      await queryInterface.addColumn('roles', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional role metadata like color, icon, etc.'
      }, { transaction });

      // Add indexes for roles
      await queryInterface.addIndex('roles', ['level'], {
        name: 'roles_level_idx',
        transaction
      });

      await queryInterface.addIndex('roles', ['parent_role_id'], {
        name: 'roles_parent_role_id_idx',
        transaction
      });

      // 2. Modify permissions table
      await queryInterface.addColumn('permissions', 'group', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'general',
        comment: 'Permission group (e.g., blog, user, admin)'
      }, { transaction });

      await queryInterface.addColumn('permissions', 'action', {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Action type (create, read, update, delete, manage)'
      }, { transaction });

      await queryInterface.addColumn('permissions', 'resource', {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Resource this permission applies to'
      }, { transaction });

      await queryInterface.addColumn('permissions', 'is_system', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if this is a system permission that cannot be deleted'
      }, { transaction });

      await queryInterface.addColumn('permissions', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional permission metadata like UI display info'
      }, { transaction });

      await queryInterface.addColumn('permissions', 'deprecated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if this permission is deprecated'
      }, { transaction });

      await queryInterface.addColumn('permissions', 'deprecated_reason', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Reason for deprecation if applicable'
      }, { transaction });

      // Add indexes for permissions
      await queryInterface.addIndex('permissions', ['group'], {
        name: 'permissions_group_idx',
        transaction
      });

      await queryInterface.addIndex('permissions', ['action', 'resource'], {
        name: 'permissions_action_resource_idx',
        transaction
      });

      // 3. Create permission_dependencies table
      await queryInterface.createTable('permission_dependencies', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        permission_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'permissions',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        required_permission_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'permissions',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        indexes: [
          {
            unique: true,
            fields: ['permission_id', 'required_permission_id'],
            name: 'permission_dependencies_unique'
          }
        ]
      });

      // 4. Create role_settings table
      await queryInterface.createTable('role_settings', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        role_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'roles',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        setting_key: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        setting_value: {
          type: Sequelize.JSONB,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        indexes: [
          {
            unique: true,
            fields: ['role_id', 'setting_key'],
            name: 'role_settings_unique'
          }
        ]
      });

      // Commit transaction
      await transaction.commit();

      // 5. Update existing data
      // Set system roles
      await queryInterface.sequelize.query(`
        UPDATE roles 
        SET is_system = true 
        WHERE name IN ('admin', 'super_admin')
      `);

      // Set system permissions
      await queryInterface.sequelize.query(`
        UPDATE permissions 
        SET is_system = true 
        WHERE name LIKE 'manage_%' OR name LIKE 'admin_%'
      `);

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop new tables
      await queryInterface.dropTable('permission_dependencies', { transaction });
      await queryInterface.dropTable('role_settings', { transaction });

      // Remove indexes
      await queryInterface.removeIndex('roles', 'roles_level_idx', { transaction });
      await queryInterface.removeIndex('roles', 'roles_parent_role_id_idx', { transaction });
      await queryInterface.removeIndex('permissions', 'permissions_group_idx', { transaction });
      await queryInterface.removeIndex('permissions', 'permissions_action_resource_idx', { transaction });

      // Remove columns from roles
      await queryInterface.removeColumn('roles', 'level', { transaction });
      await queryInterface.removeColumn('roles', 'parent_role_id', { transaction });
      await queryInterface.removeColumn('roles', 'is_system', { transaction });
      await queryInterface.removeColumn('roles', 'metadata', { transaction });

      // Remove columns from permissions
      await queryInterface.removeColumn('permissions', 'group', { transaction });
      await queryInterface.removeColumn('permissions', 'action', { transaction });
      await queryInterface.removeColumn('permissions', 'resource', { transaction });
      await queryInterface.removeColumn('permissions', 'is_system', { transaction });
      await queryInterface.removeColumn('permissions', 'metadata', { transaction });
      await queryInterface.removeColumn('permissions', 'deprecated', { transaction });
      await queryInterface.removeColumn('permissions', 'deprecated_reason', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 