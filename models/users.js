const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  const User = sequelize.define('users', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "users_email_key",
        unique: true,
        fields: [{ name: "email" }]
      },
      {
        name: "users_username_key",
        unique: true,
        fields: [{ name: "username" }]
      },
      {
        name: "users_pkey",
        unique: true,
        fields: [{ name: "id" }]
      }
    ]
  });

  User.associate = function(models) {
    // Audit logs
    User.hasMany(models.audit_logs, {
      foreignKey: 'user_id',
      as: 'auditLogs'
    });

    // Admin logs
    User.hasMany(models.admin_logs, {
      foreignKey: 'user_id',
      as: 'adminLogs'
    });

    // Blogs
    User.hasMany(models.blogs, {
      foreignKey: 'author_id',
      as: 'blogs'
    });

    // Travel Plans
    User.hasMany(models.travel_plans, {
      foreignKey: 'user_id',
      as: 'travelPlans'
    });

    // Shared Travel Plans
    User.belongsToMany(models.travel_plans, {
      through: models.travel_plan_shares,
      foreignKey: 'user_id',
      otherKey: 'travel_plan_id',
      as: 'sharedTravelPlans'
    });

    // Followers - Users that this user follows
    User.belongsToMany(models.users, {
      through: models.followers,
      foreignKey: 'follower_id',
      otherKey: 'following_id',
      as: 'followingUsers'
    });

    // Followers - Users that follow this user
    User.belongsToMany(models.users, {
      through: models.followers,
      foreignKey: 'following_id',
      otherKey: 'follower_id',
      as: 'followerUsers'
    });

    // Trophies
    User.belongsToMany(models.trophies, {
      through: models.user_trophies,
      foreignKey: 'user_id',
      otherKey: 'trophy_id',
      as: 'trophies'
    });

    // Posts
    User.hasMany(models.posts, {
      foreignKey: 'author_id',
      as: 'posts'
    });

    // Comments
    User.hasMany(models.comments, {
      foreignKey: 'user_id',
      as: 'comments'
    });

    // Notifications
    User.hasMany(models.notifications, {
      foreignKey: 'user_id',
      as: 'notifications'
    });

    // Sessions
    User.hasMany(models.sessions, {
      foreignKey: 'user_id',
      as: 'sessions'
    });
  };

  return User;
};
