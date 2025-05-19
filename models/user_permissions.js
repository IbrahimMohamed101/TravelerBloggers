const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const UserPermission = sequelize.define('user_permissions', {
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
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
        tableName: 'user_permissions',
        schema: 'public',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'user_permissions_user_id_idx',
                fields: [{ name: 'user_id' }]
            },
            {
                name: 'user_permissions_permission_id_idx',
                fields: [{ name: 'permission_id' }]
            }
        ]
    });

    return UserPermission;
};