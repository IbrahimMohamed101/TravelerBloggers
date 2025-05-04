'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Enable uuid-ossp extension for Postgres
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.createTable('user_permissions', {
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
    await queryInterface.addIndex('user_permissions', ['user_id'], {
      name: 'user_permissions_user_id_idx'
    });
    await queryInterface.addIndex('user_permissions', ['permission_id'], {
      name: 'user_permissions_permission_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_permissions');
  }
};