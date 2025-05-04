'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tags', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal('uuid_generate_v4()')
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            slug: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
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
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tags');
    }
};
