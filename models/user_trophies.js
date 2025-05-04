const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_trophies', {
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
    trophy_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'trophies',
        key: 'id'
      }
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    earned_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'user_trophies',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "user_trophies_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
