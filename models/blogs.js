const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const Blog = sequelize.define('blogs', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
    category_ids: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of category IDs'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM("draft", "published"),
      allowNull: true,
      defaultValue: "draft"
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    meta_description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    meta_keywords: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reading_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated reading time in minutes'
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of views'
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'blogs',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "blogs_pkey",
        unique: true,
        fields: [{ name: "id" }]
      },
      {
        name: "blogs_author_id_idx",
        fields: ["author_id"]
      },
      {
        name: "blogs_slug_key",
        unique: true,
        fields: ["slug"]
      },
      {
        name: "blogs_featured_idx",
        fields: ["featured"]
      },
      {
        name: "blogs_status_published_at_idx",
        fields: ["status", "published_at"]
      }
    ]
  });

  Blog.associate = function (models) {
    // Author relationship
    Blog.belongsTo(models.users, {
      as: 'author',
      foreignKey: 'author_id'
    });

    // Categories relationship
    Blog.belongsToMany(models.categories, {
      through: models.blog_categories,
      foreignKey: 'blog_id',
      otherKey: 'category_id',
      as: 'blogCategories'
    });

    // Tags relationship
    Blog.belongsToMany(models.tags, {
      through: models.blog_tags,
      foreignKey: 'blog_id',
      otherKey: 'tag_id',
      as: 'tags'
    });

    // Blog reactions
    Blog.hasMany(models.blog_reactions, {
      foreignKey: 'blog_id',
      as: 'reactions'
    });

    // Comments
    Blog.hasMany(models.comments, {
      foreignKey: 'blog_id',
      as: 'comments'
    });
  };

  return Blog;
};
