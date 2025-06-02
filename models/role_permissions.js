const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const RolePermissions = sequelize.define('role_permissions', {
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
            }
        },
        permission_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'permissions',
                key: 'id'
            }
        }
    }, {
        sequelize,
        tableName: 'role_permissions',
        schema: 'public',
        timestamps: true,
        freezeTableName: true,
        underscored: false
    });

    RolePermissions.associate = function (models) {
        if (models.permissions) {
            RolePermissions.belongsTo(models.permissions, {
                foreignKey: 'permission_id',
                targetKey: 'id',
                as: 'permission',
                constraints: true
            });
        }
        
        if (models.roles) {
            RolePermissions.belongsTo(models.roles, {
                foreignKey: 'role_id',
                targetKey: 'id',
                as: 'role',
                constraints: true
            });
        }
    };

    return RolePermissions;
};