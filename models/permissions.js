const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const Permission = sequelize.define('permissions', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        sequelize,
        tableName: 'permissions',
        schema: 'public',
        timestamps: true,
        underscored: false,
        indexes: [
            {
                name: 'permissions_name_key',
                unique: true,
                fields: [{ name: 'name' }]
            }
        ]
    });

    Permission.associate = function (models) {
        // Users (many-to-many through user_permissions)
        Permission.belongsToMany(models.users, {
            through: 'user_permissions',
            foreignKey: 'permission_id',
            otherKey: 'user_id',
            as: 'users'
        });
    };

    return Permission;
};