const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  const Categories = sequelize.define('categories', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'categories',
    schema: 'public',
    timestamps: true
  });

  Categories.associate = function(models) {
    Categories.belongsToMany(models.blogs, {
      through: models.blog_categories,
      foreignKey: 'category_id',
      otherKey: 'blog_id',
      as: 'blogs'
    });
  };

  return Categories;
};
