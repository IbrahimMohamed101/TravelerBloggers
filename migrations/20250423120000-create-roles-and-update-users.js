'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create roles table
        await queryInterface.createTable('roles', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.STRING(255),
                allowNull: true
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

        // Insert default roles
        await queryInterface.bulkInsert('roles', [
            { id: Sequelize.literal('uuid_generate_v4()'), name: 'super_admin', description: 'Super Administrator', createdAt: new Date(), updatedAt: new Date() },
            { id: Sequelize.literal('uuid_generate_v4()'), name: 'admin', description: 'Administrator', createdAt: new Date(), updatedAt: new Date() },
            { id: Sequelize.literal('uuid_generate_v4()'), name: 'content_manager', description: 'Content Manager', createdAt: new Date(), updatedAt: new Date() },
            { id: Sequelize.literal('uuid_generate_v4()'), name: 'blogger', description: 'Blogger', createdAt: new Date(), updatedAt: new Date() },
            { id: Sequelize.literal('uuid_generate_v4()'), name: 'user', description: 'Regular User', createdAt: new Date(), updatedAt: new Date() }
        ]);

        // Add role_id column to users table as nullable initially
        await queryInterface.addColumn('users', 'role_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        });

        // Update existing users to have a default role_id (e.g., 'user')
        const [results] = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE name = 'user' LIMIT 1;`
        );
        const userRoleId = results[0].id;

        await queryInterface.sequelize.query(
            `UPDATE users SET role_id = '${userRoleId}' WHERE role_id IS NULL;`
        );

        // Alter role_id column to be NOT NULL
        await queryInterface.changeColumn('users', 'role_id', {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        });

        // Remove old role ENUM column
        await queryInterface.removeColumn('users', 'role');
    },

    down: async (queryInterface, Sequelize) => {
        // Add old role ENUM column back
        await queryInterface.addColumn('users', 'role', {
            type: Sequelize.ENUM("super_admin", "admin", "content_manager", "blogger", "user"),
            allowNull: false,
            defaultValue: "user"
        });

        // Remove role_id column
        await queryInterface.removeColumn('users', 'role_id');

        // Drop roles table
        await queryInterface.dropTable('roles');
    }
};
