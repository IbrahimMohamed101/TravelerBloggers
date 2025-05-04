const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reactions', {
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
    comment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    reaction_type: {
      type: DataTypes.ENUM("like","love","wow","sad","angry"),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'reactions',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "reactions_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
