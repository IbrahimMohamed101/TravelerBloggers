'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'oauth_provider', {
      type: Sequelize.ENUM('google', 'facebook', 'discord'),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'oauth_id', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'two_factor_secret', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'is_two_factor_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('users', 'failed_login_attempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('users', 'lock_until', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'language', {
      type: Sequelize.ENUM('en', 'ar'),
      allowNull: false,
      defaultValue: 'en'
    });
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('super_admin', 'admin', 'content_manager', 'blogger', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
    await queryInterface.addIndex('users', ['oauth_provider', 'oauth_id'], {
      name: 'users_oauth_idx'
    });
    await queryInterface.addIndex('users', ['role'], {
      name: 'users_role_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'oauth_provider');
    await queryInterface.removeColumn('users', 'oauth_id');
    await queryInterface.removeColumn('users', 'two_factor_secret');
    await queryInterface.removeColumn('users', 'is_two_factor_enabled');
    await queryInterface.removeColumn('users', 'failed_login_attempts');
    await queryInterface.removeColumn('users', 'lock_until');
    await queryInterface.removeColumn('users', 'language');
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('super_admin', 'admin', 'content_manager', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
    await queryInterface.removeIndex('users', 'users_oauth_idx');
    await queryInterface.removeIndex('users', 'users_role_idx');
  }
};