const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('guest_users', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: "guest_users_session_id_key"
    },
    last_active: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'guest_users',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "guest_users_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "guest_users_session_id_key",
        unique: true,
        fields: [
          { name: "session_id" },
        ]
      },
    ]
  });
};
