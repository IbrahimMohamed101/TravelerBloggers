const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const PasswordResetToken = sequelize.define('password_reset_tokens', {
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
        }
    }, {
        sequelize,
        tableName: 'password_reset_tokens',
        schema: 'public',
        timestamps: true,
        underscored: true
    });
    PasswordResetToken.associate = function (models) {
        PasswordResetToken.belongsTo(models.users, { foreignKey: 'user_id', as: 'user' });
    };
    return PasswordResetToken;
};