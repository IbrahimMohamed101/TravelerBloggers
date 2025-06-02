'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('permission_dependencies', 'dependent_permission_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('permission_dependencies', {
      fields: ['permission_id', 'dependent_permission_id'],
      type: 'unique',
      name: 'permission_dependencies_permission_id_dependent_permission_id_key'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('permission_dependencies', 'permission_dependencies_permission_id_dependent_permission_id_key');
    await queryInterface.removeColumn('permission_dependencies', 'dependent_permission_id');
  }
};
