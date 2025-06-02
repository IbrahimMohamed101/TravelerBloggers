'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create roles table
        await queryInterface.createTable('roles', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
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

        // Create permissions table
        await queryInterface.createTable('permissions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT
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

        // Create sessions table
        await queryInterface.createTable('sessions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true
            },
            token: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            expires_at: {
                type: Sequelize.DATE,
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

        // Create users table with role reference
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING,
                allowNull: true
            },
            role_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'roles',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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

        // Create role_permissions table
        await queryInterface.createTable('role_permissions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true
            },
            role_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'roles',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            permission_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'permissions',
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

        // Add unique constraint to prevent duplicate role-permission pairs
        await queryInterface.addConstraint('role_permissions', {
            fields: ['role_id', 'permission_id'],
            type: 'unique',
            name: 'role_permission_unique'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Drop tables in reverse order of creation to handle foreign key constraints
        await queryInterface.dropTable('role_permissions');
        await queryInterface.dropTable('users');
        await queryInterface.dropTable('sessions');
        await queryInterface.dropTable('permissions');
        await queryInterface.dropTable('roles');
    }
};