const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  const TravelPlan = sequelize.define('travel_plans', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'Untitled Plan'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('draft', 'planned', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'travel_plans',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "travel_plans_pkey",
        unique: true,
        fields: ["id"]
      },
      {
        name: "travel_plans_user_status_idx",
        fields: ["user_id", "status"]
      },
      {
        name: "travel_plans_dates_idx",
        fields: ["start_date", "end_date"]
      }
    ]
  });

  TravelPlan.associate = function(models) {
    // Relationship with user (owner)
    TravelPlan.belongsTo(models.users, {
      as: 'owner',
      foreignKey: 'user_id'
    });

    // Relationship with locations
    TravelPlan.hasMany(models.travel_plan_locations, {
      as: 'locations',
      foreignKey: 'travel_plan_id'
    });

    // Relationship with shared users
    TravelPlan.belongsToMany(models.users, {
      through: models.travel_plan_shares,
      foreignKey: 'travel_plan_id',
      otherKey: 'user_id',
      as: 'sharedWith'
    });
  };

  return TravelPlan;
};
