'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('blog_reactions', 'created_at');
    await queryInterface.removeColumn('blog_reactions', 'updated_at');
    await queryInterface.addIndex('blog_reactions', ['user_id', 'blog_id', 'reaction_type'], {
      name: 'blog_reactions_user_blog_type',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('blog_reactions', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });
    await queryInterface.addColumn('blog_reactions', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });
    await queryInterface.removeIndex('blog_reactions', 'blog_reactions_user_blog_type');
  }
};