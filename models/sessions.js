const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const Sessions = sequelize.define('sessions', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        token: {
            type: DataTypes.STRING(512),
            allowNull: false,
            unique: true
        },
        ip_address: {
            type: DataTypes.STRING(45),
            allowNull: false,
            defaultValue: '0.0.0.0'
        },
        is_refresh: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        device_info: {
            type: DataTypes.JSON,
            allowNull: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        is_revoked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        sequelize,
        tableName: 'sessions',
        schema: 'public',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'sessions_user_id_idx',
                fields: ['user_id']
            },
            {
                name: 'sessions_token_idx',
                fields: ['token'],
                unique: true
            }
        ]
    });

    Sessions.associate = function(models) {
        Sessions.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return Sessions;
};
