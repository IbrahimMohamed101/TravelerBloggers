const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const RolePermissions = sequelize.define('role_permissions', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        role: {
            type: DataTypes.STRING(50),
            allowNull: false
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
        underscored: false,
        indexes: [
            {
                name: 'role_permissions_pkey',
                unique: true,
                fields: [{ name: 'id' }]
            },
            {
                name: 'role_permissions_role_permission_id_key',
                unique: true,
                fields: ['role', 'permission_id']
            }
        ]
    });

    RolePermissions.associate = function (models) {
        RolePermissions.belongsTo(models.permissions, {
            foreignKey: 'permission_id',
            as: 'permission'
        });
    };

    return RolePermissions;
};
