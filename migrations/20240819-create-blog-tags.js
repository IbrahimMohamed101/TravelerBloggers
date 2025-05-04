'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('blog_tags', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal('uuid_generate_v4()')
            },
            blog_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'blogs',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            tag_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'tags',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()')
            }
        });

        await queryInterface.addConstraint('blog_tags', {
            fields: ['blog_id', 'tag_id'],
            type: 'unique',
            name: 'blog_tags_blog_id_tag_id_key'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('blog_tags');
    }
};
