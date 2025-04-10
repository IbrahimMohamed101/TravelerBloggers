const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Users', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "users_username_key"
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "users_email_key"
    },
    role: {
      type: DataTypes.ENUM("super_admin", "admin", "content_manager", "user"),
      allowNull: false,
      defaultValue: "user"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    bio: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true
    },
    social_media: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    interested_categories: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    associate: function (models) {
      this.hasMany(models.AuditLog, {
        foreignKey: 'user_id',
        as: 'auditLogs'
      });
    },
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "users_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "users_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "users_username_key",
        unique: true,
        fields: [
          { name: "username" },
        ]
      },
    ]
  });
};
