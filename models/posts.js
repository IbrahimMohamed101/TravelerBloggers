const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('posts', {
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    visibility: {
      type: DataTypes.ENUM("public","followers","private"),
      allowNull: true,
      defaultValue: "public"
    }
  }, {
    sequelize,
    tableName: 'posts',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "posts_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
