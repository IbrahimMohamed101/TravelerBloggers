'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('comments', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            post_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'posts',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            blog_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'blogs',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            parent_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'comments',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()')
            }
        });

        // Add constraint to ensure comment is associated with either a post or a blog
        await queryInterface.sequelize.query(`
            ALTER TABLE comments 
            ADD CONSTRAINT "comment_target_check" 
            CHECK (
                (post_id IS NOT NULL AND blog_id IS NULL) OR 
                (post_id IS NULL AND blog_id IS NOT NULL)
            )
        `);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('comments');
    }
};
