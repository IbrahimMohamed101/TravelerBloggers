module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('blogs', 'views', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of views'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('blogs', 'views');
  }
};
