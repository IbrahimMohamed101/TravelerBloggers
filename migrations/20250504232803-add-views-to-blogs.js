'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if views column already exists
    const tableDesc = await queryInterface.describeTable('blogs');
    if (!tableDesc.views) {
      await queryInterface.addColumn('blogs', 'views', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of views'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if column exists before removing
    const tableDesc = await queryInterface.describeTable('blogs');
    if (tableDesc.views) {
      await queryInterface.removeColumn('blogs', 'views');
    }
  }
};