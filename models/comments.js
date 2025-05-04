const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('comments', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    blog_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'blogs',
        key: 'id'
      }
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'comments',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "comments_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
