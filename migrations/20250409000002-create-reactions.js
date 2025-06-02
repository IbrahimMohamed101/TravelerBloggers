'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('reactions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
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
            target_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            target_type: {
                type: Sequelize.ENUM('blog', 'post', 'comment'),
                allowNull: false
            },
            reaction_type: {
                type: Sequelize.ENUM('like', 'love', 'wow', 'sad', 'angry'),
                allowNull: false
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

        // Add indexes
        await queryInterface.addIndex('reactions', ['user_id']);
        await queryInterface.addIndex('reactions', ['target_id', 'target_type']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('reactions');
    }
};
