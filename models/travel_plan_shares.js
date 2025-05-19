const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('travel_plan_shares', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    travel_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'travel_plans',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'travel_plan_shares',
    schema: 'public',
    timestamps: false
  });
};
