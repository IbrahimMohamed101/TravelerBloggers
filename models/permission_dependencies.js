'use strict';

module.exports = function(sequelize, DataTypes) {
  const PermissionDependencies = sequelize.define('permission_dependencies', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    dependent_permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    tableName: 'permission_dependencies',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['permission_id', 'dependent_permission_id']
      }
    ]
  });

  PermissionDependencies.associate = function(models) {
    PermissionDependencies.belongsTo(models.permissions, {
      foreignKey: 'permission_id',
      as: 'permission'
    });
    PermissionDependencies.belongsTo(models.permissions, {
      foreignKey: 'dependent_permission_id',
      as: 'dependent_permission'
    });
  };

  return PermissionDependencies;
};
