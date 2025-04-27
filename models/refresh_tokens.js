const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const RefreshToken = sequelize.define('refresh_tokens', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        is_revoked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        tableName: 'refresh_tokens',
        schema: 'public',
        timestamps: true,
        underscored: true
    });
    RefreshToken.associate = function (models) {
        RefreshToken.belongsTo(models.users, { foreignKey: 'user_id', as: 'user' });
    };
    return RefreshToken;
};