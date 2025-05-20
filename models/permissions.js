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
        },
        group: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'general',
            comment: 'Permission group (e.g., blog, user, admin)'
        },
        action: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Action type (create, read, update, delete, manage)'
        },
        resource: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Resource this permission applies to'
        },
        is_system: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indicates if this is a system permission that cannot be deleted'
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional permission metadata like UI display info'
        },
        deprecated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indicates if this permission is deprecated'
        },
        deprecated_reason: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Reason for deprecation if applicable'
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
            },
            {
                name: 'permissions_group_idx',
                fields: ['group']
            },
            {
                name: 'permissions_action_resource_idx',
                fields: ['action', 'resource']
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
        
        // Role permissions
        Permission.hasMany(models.role_permissions, {
            foreignKey: 'permission_id',
            sourceKey: 'id',
            as: 'rolePermissions'
        });

        // Permission dependencies
        Permission.belongsToMany(Permission, {
            through: 'permission_dependencies',
            foreignKey: 'permission_id',
            otherKey: 'required_permission_id',
            as: 'requiredPermissions'
        });
    };

    // Class methods
    Permission.findByActionAndResource = async function(action, resource) {
        return this.findOne({
            where: { action, resource }
        });
    };

    Permission.findByGroup = async function(group) {
        return this.findAll({
            where: { group }
        });
    };

    // Instance methods
    Permission.prototype.getFullName = function() {
        return `${this.action}:${this.resource}`;
    };

    Permission.prototype.hasRequiredPermissions = async function() {
        const requiredPermissions = await this.getRequiredPermissions();
        return requiredPermissions.length > 0;
    };

    return Permission;
};