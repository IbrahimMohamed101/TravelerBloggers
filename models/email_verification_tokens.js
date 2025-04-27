const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const EmailVerificationToken = sequelize.define('email_verification_tokens', {
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
        tableName: 'email_verification_tokens',
        schema: 'public',
        timestamps: true,
        underscored: true
    });
    EmailVerificationToken.associate = function (models) {
        EmailVerificationToken.belongsTo(models.users, { foreignKey: 'user_id', as: 'user' });
    };
    return EmailVerificationToken;
};