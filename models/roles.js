const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const Roles = sequelize.define('roles', {
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
        tableName: 'roles',
        schema: 'public',
        timestamps: true,
        underscored: false,
        indexes: [
            {
                name: 'roles_pkey',
                unique: true,
                fields: [{ name: 'id' }]
            },
            {
                name: 'roles_name_key',
                unique: true,
                fields: ['name']
            }
        ]
    });

    Roles.associate = function (models) {
        Roles.hasMany(models.users, {
            foreignKey: 'role_id',
            as: 'users'
        });
    };

    return Roles;
};