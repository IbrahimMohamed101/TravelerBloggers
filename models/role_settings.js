'use strict';

module.exports = function(sequelize, DataTypes) {
  const RoleSettings = sequelize.define('role_settings', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'role_settings',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'key']
      }
    ]
  });

  RoleSettings.associate = function(models) {
    RoleSettings.belongsTo(models.roles, {
      foreignKey: 'role_id',
      as: 'role'
    });
  };

  return RoleSettings;
};
