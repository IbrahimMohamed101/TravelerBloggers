const sequelize = require('./../config/sequelize');
const initModels = require('../models/init-models');
const logger = require('../utils/logger');
const { requiredModels } = require('./containerConfig');

async function initDB() {
    try {
        await sequelize.authenticate();
        logger.info('Database connection verified');

        const db = initModels(sequelize);

        const missingModels = requiredModels.filter(model => !db[model]);
        if (missingModels.length > 0) {
            throw new Error(`Missing models: ${missingModels.join(', ')}`);
        }

        logger.info('All required models verified');
        return { db, sequelize };
    } catch (err) {
        logger.error('DB Initialization failed:', err);
        throw err;
    }
}

module.exports = initDB;
