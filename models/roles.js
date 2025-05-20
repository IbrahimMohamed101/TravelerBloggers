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
                name: 'roles_pkey',
                unique: true,
                fields: [{ name: 'id' }]
            },
            {
                name: 'roles_name_key',
                unique: true,
                fields: ['name']
            },
            {
                name: 'roles_level_idx',
                fields: ['level']
            },
            {
                name: 'roles_parent_role_id_idx',
                fields: ['parent_role_id']
            }
        ]
    });

    Roles.associate = function (models) {
        // Users association
        Roles.hasMany(models.users, {
            foreignKey: 'role_id',
            as: 'users'
        });

        // Self-referential relationship for role hierarchy
        Roles.belongsTo(Roles, {
            foreignKey: 'parent_role_id',
            as: 'parentRole'
        });

        Roles.hasMany(Roles, {
            foreignKey: 'parent_role_id',
            as: 'childRoles'
        });

        // Role permissions through role_permissions
        Roles.belongsToMany(models.permissions, {
            through: 'role_permissions',
            foreignKey: 'role',
            otherKey: 'permission_id',
            as: 'permissions'
        });
    };

    // Instance methods
    Roles.prototype.hasPermission = async function(permissionName) {
        // Get all permissions including inherited ones
        const allPermissions = await this.getAllPermissions();
        return allPermissions.some(p => p.name === permissionName);
    };

    Roles.prototype.getAllPermissions = async function() {
        const permissions = new Set();
        
        // Get direct permissions
        const directPermissions = await this.getPermissions();
        directPermissions.forEach(p => permissions.add(p));

        // Get inherited permissions from parent roles
        let currentRole = this;
        while (currentRole.parent_role_id) {
            const parentRole = await currentRole.getParentRole();
            if (!parentRole) break;
            
            const parentPermissions = await parentRole.getPermissions();
            parentPermissions.forEach(p => permissions.add(p));
            currentRole = parentRole;
        }

        return Array.from(permissions);
    };

    return Roles;
};