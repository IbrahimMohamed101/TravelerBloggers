'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('audit_logs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            action: {
                type: Sequelize.STRING,
                allowNull: false
            },
            details: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            user_agent: {
                type: Sequelize.STRING,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('audit_logs', ['user_id']);
        await queryInterface.addIndex('audit_logs', ['action']);
        await queryInterface.addIndex('audit_logs', ['created_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('audit_logs');
    }
};
