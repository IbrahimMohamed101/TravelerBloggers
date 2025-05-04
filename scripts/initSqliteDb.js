const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const initModels = require('../models/init-models');
const sequelize = require('../config/database_sqlite');

async function initializeSqliteDatabase() {
    try {
        // Ensure data directory exists
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Authenticate connection
        await sequelize.authenticate();
        console.log('Connection to SQLite database has been established successfully.');

        // Initialize models
        initModels(sequelize);

        // Sync all models
        await sequelize.sync({ force: true });
        console.log('All models were synchronized successfully.');

        await sequelize.close();
    } catch (error) {
        console.error('Unable to initialize SQLite database:', error);
    }
}

initializeSqliteDatabase();
