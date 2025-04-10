const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'db',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        retry: {
            match: [
                /ECONNREFUSED/,
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNRESET/,
            ],
            max: 5,
            timeout: 60000
        },
        pool: {
            max: 20,
            min: 0,
            acquire: 60000,
            idle: 10000,
        },
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models with error handling
const loadModels = () => {
    const modelsPath = path.join(__dirname, '../models');
    const modelFiles = fs.readdirSync(modelsPath)
        .filter(file => file.endsWith('.js'));

    // Load core models first
    const coreModels = ['users.js', 'sessions.js', 'auditLog.js'];
    coreModels.forEach(file => {
        try {
            const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
            db[model.name] = model;
            console.log(`Loaded core model: ${model.name}`);
        } catch (error) {
            console.error(`Error loading core model ${file}:`, error);
            throw error;
        }
    });

    // Load other models
    modelFiles.filter(file => !coreModels.includes(file)).forEach(file => {
        try {
            const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
            db[model.name] = model;
            console.log(`Loaded model: ${model.name}`);
        } catch (error) {
            console.error(`Error loading model ${file}:`, error);
        }
    });
};

// Initialize database connection and models
db.initialize = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established');

        loadModels();

        // Set up associations
        Object.keys(db).forEach(modelName => {
            if (db[modelName].associate) {
                db[modelName].associate(db);
            }
        });

        // Sync tables with error handling
        await db.syncTables();
        return db;
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
};

// Custom sync function with ordered table creation
db.syncTables = async () => {
    try {
        console.log('Starting database sync...');
        const forceSync = process.env.FORCE_SYNC === 'true';

        // Sync core tables first with error handling
        try {
            await db.Users.sync({ force: forceSync });
            await db.sessions.sync({ force: forceSync });

            // Special handling for AuditLog due to known schema issues
            try {
                await db.AuditLog.sync({ force: forceSync });
            } catch (auditLogError) {
                console.error('AuditLog sync failed, attempting to recreate table...');
                await db.AuditLog.sync({ force: true });
            }
        } catch (coreError) {
            console.error('Core tables sync failed:', coreError);
            throw coreError;
        }

        // Sync other tables with individual error handling
        const otherModels = Object.keys(db).filter(modelName =>
            !['Users', 'sessions', 'AuditLog', 'Sequelize', 'sequelize', 'initialize', 'syncTables'].includes(modelName)
        );

        for (const modelName of otherModels) {
            try {
                await db[modelName].sync({ force: forceSync });
                console.log(`Synced table: ${modelName}`);
            } catch (modelError) {
                console.error(`Failed to sync ${modelName}:`, modelError);
                if (forceSync) {
                    await db[modelName].sync({ force: true });
                }
            }
        }

        console.log('Database sync completed successfully');
    } catch (error) {
        console.error('Database sync failed:', error);
        throw error;
    }
};

module.exports = db;
