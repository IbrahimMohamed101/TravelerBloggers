'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding them
    const tableDesc = await queryInterface.describeTable('users');
    
    // Add columns if they don't exist
    const columnsToAdd = [
      {
        name: 'oauth_provider',
        config: {
          type: Sequelize.ENUM('google', 'facebook', 'discord'),
          allowNull: true
        }
      },
      {
        name: 'oauth_id',
        config: {
          type: Sequelize.STRING(255),
          allowNull: true
        }
      },
      {
        name: 'two_factor_secret',
        config: {
          type: Sequelize.STRING(255),
          allowNull: true
        }
      },
      {
        name: 'is_two_factor_enabled',
        config: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      },
      {
        name: 'failed_login_attempts',
        config: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        name: 'lock_until',
        config: {
          type: Sequelize.DATE,
          allowNull: true
        }
      },
      {
        name: 'language',
        config: {
          type: Sequelize.ENUM('en', 'ar'),
          allowNull: false,
          defaultValue: 'en'
        }
      }
    ];

    // Add each column if it doesn't exist
    for (const column of columnsToAdd) {
      if (!tableDesc[column.name]) {
        await queryInterface.addColumn('users', column.name, column.config);
      }
    }

    // Change role column if it exists (assuming it's currently just a string)
    if (tableDesc.role) {
      await queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM('super_admin', 'admin', 'content_manager', 'blogger', 'user'),
        allowNull: false,
        defaultValue: 'user'
      });
    }

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex('users', ['oauth_provider', 'oauth_id'], {
        name: 'users_oauth_idx'
      });
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.log('Index users_oauth_idx may already exist:', err.message);
      }
    }

    try {
      await queryInterface.addIndex('users', ['role'], {
        name: 'users_role_idx'
      });
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.log('Index users_role_idx may already exist:', err.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columnsToRemove = [
      'oauth_provider',
      'oauth_id',
      'two_factor_secret',
      'is_two_factor_enabled',
      'failed_login_attempts',
      'lock_until',
      'language'
    ];

    // Remove indexes first
    try {
      await queryInterface.removeIndex('users', 'users_oauth_idx');
    } catch (err) {
      console.log('Index users_oauth_idx may not exist:', err.message);
    }

    try {
      await queryInterface.removeIndex('users', 'users_role_idx');
    } catch (err) {
      console.log('Index users_role_idx may not exist:', err.message);
    }

    // Remove each column
    for (const columnName of columnsToRemove) {
      try {
        await queryInterface.removeColumn('users', columnName);
      } catch (err) {
        console.log(`Column ${columnName} may not exist:`, err.message);
      }
    }

    // Revert role column back to original state (adjust as needed)
    try {
      await queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM('super_admin', 'admin', 'content_manager', 'user'),
        allowNull: false,
        defaultValue: 'user'
      });
    } catch (err) {
      console.log('Could not revert role column:', err.message);
    }
  }
};