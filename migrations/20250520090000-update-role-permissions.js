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
                const tableInfo = await queryInterface.describeTable('role_permissions');
                const hasRoleColumn = 'role' in tableInfo;
                const hasRoleIdColumn = 'role_id' in tableInfo;
                
                let existingData;
                if (hasRoleColumn) {
                    existingData = await queryInterface.sequelize.query(
                        'SELECT id, role, permission_id, "createdAt", "updatedAt" FROM role_permissions;',
                        { type: queryInterface.sequelize.QueryTypes.SELECT }
                    );
                } else if (hasRoleIdColumn) {
                    existingData = await queryInterface.sequelize.query(
                        'SELECT id, role_id, permission_id, created_at, updated_at FROM role_permissions;',
                        { type: queryInterface.sequelize.QueryTypes.SELECT }
                    );
                }
                
                // Drop existing table
                await queryInterface.dropTable('role_permissions');
                
                // Create table with new schema
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
                
                // Add constraint
                await queryInterface.addConstraint('role_permissions', {
                    fields: ['role_id', 'permission_id'],
                    type: 'unique',
                    name: 'role_permissions_role_id_permission_id_key'
                });
                
                // Restore data if any exists
                if (existingData && existingData.length > 0) {
                    if (hasRoleColumn) {
                        // We need to convert role names to role_ids
                        const roleMapping = await queryInterface.sequelize.query(
                            'SELECT id, name FROM roles;',
                            { type: queryInterface.sequelize.QueryTypes.SELECT }
                        );
                        
                        const roleNameToId = {};
                        roleMapping.forEach(role => {
                            roleNameToId[role.name] = role.id;
                        });
                        
                        for (const record of existingData) {
                            const roleId = roleNameToId[record.role];
                            if (roleId) {
                                await queryInterface.sequelize.query(
                                    `INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at) 
                                     VALUES ('${record.id}', '${roleId}', '${record.permission_id}', '${record.createdAt}', '${record.updatedAt}');`
                                );
                            }
                        }
                    } else {
                        // Data already has role_id, just insert it back
                        await queryInterface.bulkInsert('role_permissions', existingData);
                    }
                }
            }
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('role_permissions');
    }
};
