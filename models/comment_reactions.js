const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('comment_reactions', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true
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
        comment_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'comments',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        reaction_type: {
            type: DataTypes.ENUM("like", "love", "wow", "sad", "angry"),
            allowNull: false
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
        tableName: 'comment_reactions',
        schema: 'public',
        timestamps: false,
        indexes: [
            {
                name: "comment_reactions_pkey",
                unique: true,
                fields: [
                    { name: "id" },
                ]
            },
        ]
    });
};
