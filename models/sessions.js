const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('sessions', {
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
            defaultValue: true,
            comment: 'Whether session is currently active'
        },
        last_activity: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp of last activity in session'
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
        sequelize,
        tableName: 'sessions',
        schema: 'public',
        timestamps: false,
        indexes: [
            {
                name: "sessions_pkey",
                unique: true,
                fields: [
                    { name: "id" },
                ]
            },
            {
                name: "sessions_token_key",
                unique: true,
                fields: [
                    { name: "token" },
                ]
            },
            {
                name: "sessions_user_id_index",
                fields: [
                    { name: "user_id" },
                ]
            }
        ]
    });
};
