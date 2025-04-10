const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('blog_reactions', {
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
        blog_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'blogs',
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
        tableName: 'blog_reactions',
        schema: 'public',
        timestamps: false,
        indexes: [
            {
                name: "blog_reactions_pkey",
                unique: true,
                fields: [
                    { name: "id" },
                ]
            },
        ]
    });
};
