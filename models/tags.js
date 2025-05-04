const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const Tag = sequelize.define('tags', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        tableName: 'tags',
        schema: 'public',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: "tags_pkey",
                unique: true,
                fields: [{ name: "id" }]
            },
            {
                name: "tags_name_key",
                unique: true,
                fields: ["name"]
            },
            {
                name: "tags_slug_key",
                unique: true,
                fields: ["slug"]
            }
        ]
    });

    Tag.associate = function (models) {
        Tag.belongsToMany(models.blogs, {
            through: models.blog_tags,
            foreignKey: 'tag_id',
            otherKey: 'blog_id',
            as: 'taggedBlogs'
        });
    };

    return Tag;
};
