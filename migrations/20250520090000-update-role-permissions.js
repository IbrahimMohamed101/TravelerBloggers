'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // Make sure the uuid-ossp extension is enabled
            await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            
            // Check if the table exists
            const tableExists = await queryInterface.sequelize.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'role_permissions'
                );`,
                { type: queryInterface.sequelize.QueryTypes.SELECT }
            );
            
            if (tableExists[0].exists) {
                // Backup any existing data
                const existingData = await queryInterface.sequelize.query(
                    'SELECT id, role, permission_id, "createdAt", "updatedAt" FROM role_permissions;',
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );
                
                // Drop existing table
                await queryInterface.dropTable('role_permissions');
                
                // Create table with new schema
                await queryInterface.createTable('role_permissions', {
                    id: {
                        type: Sequelize.UUID,
                        primaryKey: true,
                        defaultValue: Sequelize.UUIDV4,
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
                
                // Add constraint
                await queryInterface.addConstraint('role_permissions', {
                    fields: ['role_id', 'permission_id'],
                    type: 'unique',
                    name: 'role_permissions_role_id_permission_id_key'
                });
                
                // We'll get the role IDs based on names to migrate the data
                // and insert them back if there's any data to migrate
                if (existingData.length > 0) {
                    console.log(`Found ${existingData.length} records to migrate.`);
                    
                    // Get mapping of role names to IDs
                    const roleMapping = await queryInterface.sequelize.query(
                        'SELECT id, name FROM roles;',
                        { type: queryInterface.sequelize.QueryTypes.SELECT }
                    );
                    
                    // Create a mapping object
                    const roleNameToId = {};
                    roleMapping.forEach(role => {
                        roleNameToId[role.name] = role.id;
                    });
                    
                    // Build insert queries for each record
                    for (const record of existingData) {
                        const roleId = roleNameToId[record.role];
                        if (roleId) {
                            await queryInterface.sequelize.query(
                                `INSERT INTO role_permissions (id, role_id, permission_id, "createdAt", "updatedAt") 
                                 VALUES ('${record.id}', '${roleId}', '${record.permission_id}', '${record.createdAt.toISOString()}', '${record.updatedAt.toISOString()}');`
                            );
                        } else {
                            console.warn(`Could not find role ID for role name: ${record.role}`);
                        }
                    }
                    console.log(`Data migration completed.`);
                }
            } else {
                // Create table if it doesn't exist
                await queryInterface.createTable('role_permissions', {
                    id: {
                        type: Sequelize.UUID,
                        primaryKey: true,
                        defaultValue: Sequelize.UUIDV4,
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
                
                // Add constraint
                await queryInterface.addConstraint('role_permissions', {
                    fields: ['role_id', 'permission_id'],
                    type: 'unique',
                    name: 'role_permissions_role_id_permission_id_key'
                });
            }
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        try {
            // Check if the table exists
            const tableExists = await queryInterface.sequelize.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'role_permissions'
                );`,
                { type: queryInterface.sequelize.QueryTypes.SELECT }
            );
            
            if (tableExists[0].exists) {
                // Backup any existing data that uses role_id
                const existingData = await queryInterface.sequelize.query(
                    'SELECT id, role_id, permission_id, "createdAt", "updatedAt" FROM role_permissions;',
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );
                
                // Drop existing table
                await queryInterface.dropTable('role_permissions');
                
                // Re-create the original schema
                await queryInterface.createTable('role_permissions', {
                    id: {
                        type: Sequelize.UUID,
                        primaryKey: true,
                        defaultValue: Sequelize.UUIDV4,
                        allowNull: false
                    },
                    role: {
                        type: Sequelize.STRING(50),
                        allowNull: false
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
                
                // Add constraint
                await queryInterface.addConstraint('role_permissions', {
                    fields: ['role', 'permission_id'],
                    type: 'unique',
                    name: 'role_permissions_role_permission_id_key'
                });
                
                // Migrate data back if there is any
                if (existingData.length > 0) {
                    console.log(`Found ${existingData.length} records to migrate back.`);
                    
                    // Get mapping of role IDs to names
                    const roleMapping = await queryInterface.sequelize.query(
                        'SELECT id, name FROM roles;',
                        { type: queryInterface.sequelize.QueryTypes.SELECT }
                    );
                    
                    // Create a mapping object
                    const roleIdToName = {};
                    roleMapping.forEach(role => {
                        roleIdToName[role.id] = role.name;
                    });
                    
                    // Build insert queries for each record
                    for (const record of existingData) {
                        const roleName = roleIdToName[record.role_id];
                        if (roleName) {
                            await queryInterface.sequelize.query(
                                `INSERT INTO role_permissions (id, role, permission_id, "createdAt", "updatedAt") 
                                 VALUES ('${record.id}', '${roleName}', '${record.permission_id}', '${record.createdAt.toISOString()}', '${record.updatedAt.toISOString()}');`
                            );
                        } else {
                            console.warn(`Could not find role name for role ID: ${record.role_id}`);
                        }
                    }
                    console.log(`Data migration back completed.`);
                }
            }
        } catch (error) {
            console.error('Down migration error:', error);
            throw error;
        }
    }
};
