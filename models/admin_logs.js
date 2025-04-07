const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('admin_logs', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'admin_logs',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "admin_logs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
