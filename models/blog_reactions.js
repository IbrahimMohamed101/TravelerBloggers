module.exports = function (sequelize, DataTypes) {
    return sequelize.define('blog_reactions', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4 // إضافة defaultValue
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },
        blog_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'blogs', key: 'id' },
            onDelete: 'CASCADE'
        },
        reaction_type: {
            type: DataTypes.ENUM('like', 'love', 'wow', 'sad', 'angry'),
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'blog_reactions',
        schema: 'public',
        timestamps: true, // تفعيل timestamps
        indexes: [
            {
                name: 'blog_reactions_pkey',
                unique: true,
                fields: [{ name: 'id' }]
            },
            {
                name: 'blog_reactions_user_blog_type',
                unique: true, // منع التكرار
                fields: [{ name: 'user_id' }, { name: 'blog_id' }, { name: 'reaction_type' }]
            }
        ]
    });
};