'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Check if roles table exists, create if it doesn't
        const tableExists = await queryInterface.describeTable('roles').catch(() => null);
        
        if (!tableExists) {
            await queryInterface.createTable('roles', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: Sequelize.UUIDV4
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
                created_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updated_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            });
        }

        // Check if default roles already exist to avoid duplicates
        const existingRoles = await queryInterface.sequelize.query(
            `SELECT name FROM roles WHERE name IN ('super_admin', 'admin', 'content_manager', 'blogger', 'user');`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const existingRoleNames = existingRoles.map(role => role.name);
        const rolesToInsert = [
            { name: 'super_admin', description: 'Super Administrator with full system access' },
            { name: 'admin', description: 'Administrator' },
            { name: 'content_manager', description: 'Content Manager' },
            { name: 'blogger', description: 'Blogger' },
            { name: 'user', description: 'Regular User' }
        ].filter(role => !existingRoleNames.includes(role.name));

        // Insert only non-existing roles
        if (rolesToInsert.length > 0) {
            const rolesToInsertWithIds = rolesToInsert.map(role => ({
                id: Sequelize.literal('uuid_generate_v4()'),
                name: role.name,
                description: role.description,
                created_at: new Date(),
                updated_at: new Date()
            }));

            await queryInterface.bulkInsert('roles', rolesToInsertWithIds);
        }

        // Check if users table exists and if role_id column already exists
        const usersTableDesc = await queryInterface.describeTable('users').catch(() => null);
        
        if (usersTableDesc) {
            // Add role_id column to users table if it doesn't exist
            if (!usersTableDesc.role_id) {
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
                    `SELECT id FROM roles WHERE name = 'user' LIMIT 1;`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                if (results && results.length > 0) {
                    const userRoleId = results[0].id;
                    await queryInterface.sequelize.query(
                        `UPDATE users SET role_id = :roleId WHERE role_id IS NULL;`,
                        {
                            replacements: { roleId: userRoleId },
                            type: queryInterface.sequelize.QueryTypes.UPDATE
                        }
                    );
                }

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
            }

            // Remove old role ENUM column if it exists
            if (usersTableDesc.role) {
                await queryInterface.removeColumn('users', 'role');
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Check if users table exists
        const usersTableDesc = await queryInterface.describeTable('users').catch(() => null);
        
        if (usersTableDesc) {
            // Add old role ENUM column back if it doesn't exist
            if (!usersTableDesc.role) {
                await queryInterface.addColumn('users', 'role', {
                    type: Sequelize.ENUM("super_admin", "admin", "content_manager", "blogger", "user"),
                    allowNull: false,
                    defaultValue: "user"
                });
            }

            // Remove role_id column if it exists
            if (usersTableDesc.role_id) {
                await queryInterface.removeColumn('users', 'role_id');
            }
        }

        // Check if roles table exists before dropping
        const rolesTableExists = await queryInterface.describeTable('roles').catch(() => null);
        if (rolesTableExists) {
            await queryInterface.dropTable('roles');
        }
    }
};