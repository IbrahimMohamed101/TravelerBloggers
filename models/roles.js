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
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Hierarchy level of the role (higher number means more privileges)'
        },
        parent_role_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'roles',
                key: 'id'
            },
            comment: 'Reference to parent role for role inheritance'
        },
        is_system: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indicates if this is a system role that cannot be deleted'
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional role metadata like color, icon, etc.'
        }
    }, {
        sequelize,
        tableName: 'roles',
        schema: 'public',
        timestamps: true,
        underscored: false,
        indexes: [
            {
                name: "roles_name_key",
                unique: true,
                fields: ["name"]
            }
        ]
    });

    Roles.associate = function(models) {
        // Self-referential relationships: parentRole and childRoles
        Roles.belongsTo(models.roles, {
            foreignKey: 'parent_role_id',
            as: 'parentRole'
        });
        Roles.hasMany(models.roles, {
            foreignKey: 'parent_role_id',
            as: 'childRoles'
        });
    };

    return Roles;
};