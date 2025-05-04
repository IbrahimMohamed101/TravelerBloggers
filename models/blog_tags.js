const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const BlogTags = sequelize.define('blog_tags', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
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
        tag_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'tags',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        sequelize,
        tableName: 'blog_tags',
        schema: 'public',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: "blog_tags_pkey",
                unique: true,
                fields: [{ name: "id" }]
            },
            {
                name: "blog_tags_blog_id_tag_id_key",
                unique: true,
                fields: ["blog_id", "tag_id"]
            }
        ]
    });

    BlogTags.associate = function (models) {
        BlogTags.belongsTo(models.blogs, { foreignKey: 'blog_id', as: 'blog' });
        BlogTags.belongsTo(models.tags, { foreignKey: 'tag_id', as: 'tag' });
    };

    return BlogTags;
};
