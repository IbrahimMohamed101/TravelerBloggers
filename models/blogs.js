const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('blogs', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "blogs_slug_key"
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    cover_image: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    categories: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM("draft","published"),
      allowNull: true,
      defaultValue: "draft"
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'blogs',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "blogs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "blogs_slug_key",
        unique: true,
        fields: [
          { name: "slug" },
        ]
      },
    ]
  });
};
