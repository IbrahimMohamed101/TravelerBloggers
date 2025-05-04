const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('blog_categories', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    blog_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'blogs',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'blog_categories',
    schema: 'public',
    timestamps: false
  });
};
