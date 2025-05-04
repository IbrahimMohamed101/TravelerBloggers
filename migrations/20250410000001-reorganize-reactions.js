'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Create new tables
        await queryInterface.createTable('blog_reactions', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true
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
            blog_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'blogs',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            reaction_type: {
                type: Sequelize.ENUM("like", "love", "wow", "sad", "angry"),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        await queryInterface.createTable('post_reactions', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true
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
                allowNull: false,
                references: {
                    model: 'posts',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            reaction_type: {
                type: Sequelize.ENUM("like", "love", "wow", "sad", "angry"),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        await queryInterface.createTable('comment_reactions', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true
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
            comment_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'comments',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            reaction_type: {
                type: Sequelize.ENUM("like", "love", "wow", "sad", "angry"),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Migrate existing data
        const [reactions] = await queryInterface.sequelize.query('SELECT * FROM reactions');

        for (const reaction of reactions) {
            if (reaction.blog_id) {
                await queryInterface.insert(null, 'blog_reactions', {
                    id: reaction.id,
                    user_id: reaction.user_id,
                    blog_id: reaction.blog_id,
                    reaction_type: reaction.reaction_type,
                    created_at: reaction.created_at,
                    updated_at: reaction.updated_at
                });
            } else if (reaction.post_id) {
                await queryInterface.insert(null, 'post_reactions', {
                    id: reaction.id,
                    user_id: reaction.user_id,
                    post_id: reaction.post_id,
                    reaction_type: reaction.reaction_type,
                    created_at: reaction.created_at,
                    updated_at: reaction.updated_at
                });
            } else if (reaction.comment_id) {
                await queryInterface.insert(null, 'comment_reactions', {
                    id: reaction.id,
                    user_id: reaction.user_id,
                    comment_id: reaction.comment_id,
                    reaction_type: reaction.reaction_type,
                    created_at: reaction.created_at,
                    updated_at: reaction.updated_at
                });
            }
        }

        // Drop old table
        await queryInterface.dropTable('reactions');
    },

    async down(queryInterface, Sequelize) {
        // Recreate old table
        await queryInterface.createTable('reactions', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            blog_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'blogs',
                    key: 'id'
                }
            },
            post_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'posts',
                    key: 'id'
                }
            },
            comment_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'comments',
                    key: 'id'
                }
            },
            reaction_type: {
                type: Sequelize.ENUM("like", "love", "wow", "sad", "angry"),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Migrate data back
        const [blogReactions] = await queryInterface.sequelize.query('SELECT * FROM blog_reactions');
        const [postReactions] = await queryInterface.sequelize.query('SELECT * FROM post_reactions');
        const [commentReactions] = await queryInterface.sequelize.query('SELECT * FROM comment_reactions');

        for (const reaction of [...blogReactions, ...postReactions, ...commentReactions]) {
            await queryInterface.insert(null, 'reactions', {
                id: reaction.id,
                user_id: reaction.user_id,
                blog_id: reaction.blog_id || null,
                post_id: reaction.post_id || null,
                comment_id: reaction.comment_id || null,
                reaction_type: reaction.reaction_type,
                created_at: reaction.created_at,
                updated_at: reaction.updated_at
            });
        }

        // Drop new tables
        await queryInterface.dropTable('blog_reactions');
        await queryInterface.dropTable('post_reactions');
        await queryInterface.dropTable('comment_reactions');
    }
};
