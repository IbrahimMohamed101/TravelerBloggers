'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add new fields
        await queryInterface.addColumn('sessions', 'is_active', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether the session is currently active'
        });

        await queryInterface.addColumn('sessions', 'last_activity', {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Timestamp of last activity in this session'
        });

        // Add ON DELETE CASCADE
        await queryInterface.removeConstraint('sessions', 'sessions_user_id_fkey');
        await queryInterface.addConstraint('sessions', {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'sessions_user_id_fkey',
            references: {
                table: 'users',
                field: 'id'
            },
            onDelete: 'CASCADE'
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove new fields
        await queryInterface.removeColumn('sessions', 'is_active');
        await queryInterface.removeColumn('sessions', 'last_activity');

        // Revert foreign key constraint
        await queryInterface.removeConstraint('sessions', 'sessions_user_id_fkey');
        await queryInterface.addConstraint('sessions', {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'sessions_user_id_fkey',
            references: {
                table: 'users',
                field: 'id'
            }
        });
    }
};
