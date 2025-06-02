'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('role_permissions', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                allowNull: false
            },
            role_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'roles',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            permission_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'permissions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addConstraint('role_permissions', {
            fields: ['role_id', 'permission_id'],
            type: 'unique',
            name: 'role_permissions_role_id_permission_id_key'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('role_permissions');
    }
};
