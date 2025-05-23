const fs = require('fs').promises;
const path = require('path');
const sequelize = require('../config/sequelize');
const logger = require('../utils/logger');

async function runSQLFix() {
    const transaction = await sequelize.transaction();
    
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, '..', 'fix_role_duplicates.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');
        
        // Split and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await sequelize.query(statement, { transaction });
                logger.info('Executed SQL statement successfully');
            }
        }
        
        await transaction.commit();
        logger.info('SQL fix completed successfully');
        
    } catch (error) {
        await transaction.rollback();
        logger.error('Error executing SQL fix:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run the fix
runSQLFix().catch(console.error);
