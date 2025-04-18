const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: 'db', // Use Docker service name
        port: 5432, // Internal container port
        dialect: 'postgres',
        logging: false,
        retry: {
            match: [
                /ECONNREFUSED/,
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNRESET/,
            ],
            max: 5, // Maximum retry attempts
            timeout: 60000 // Timeout per attempt (ms)
        },
        pool: {
            max: 20,
            min: 0,
            acquire: 60000, // Increased from 30000
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true
        }
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models synchronously and verify
const modelFiles = fs.readdirSync(path.join(__dirname, '../models'))
    .filter((file) => file.endsWith('.js') && file !== 'init-models.js');

// Define the order of model loading
const modelOrder = [
    // Core models
    'users.js',
    'sessions.js',
    'permissions.js',
    'admin_logs.js',
    'audit_logs.js',
    
    // Content models
    'categories.js',
    'blogs.js',
    'blog_reactions.js',
    'posts.js',
    'post_reactions.js',
    'comments.js',
    'comment_reactions.js',
    'reactions.js',
    
    // Travel related models
    'travel_plans.js',
    'travel_plan_locations.js',
    'travel_plan_shares.js',
    
    // User related models
    'followers.js',
    'guest_users.js',
    'notifications.js',
    'trophies.js',
    'user_trophies.js',
    
    // Other models
    'events.js',
    'contact_messages.js'
];

// Sort model files based on the defined order
const sortedModelFiles = [
    ...modelOrder.filter(file => modelFiles.includes(file)),
    ...modelFiles.filter(file => !modelOrder.includes(file))
];

// Load models in the correct order
sortedModelFiles.forEach((file) => {
    try {
        const modelPath = path.join(__dirname, '../models', file);
        const model = require(modelPath)(sequelize, Sequelize.DataTypes);
        if (!model.name) {
            console.error(`Model in file ${file} has no name property`);
            throw new Error(`Model in file ${file} has no name property`);
        }
        db[model.name] = model;
        console.log(`Successfully loaded model: ${model.name} from ${file}`);
    } catch (error) {
        console.error(`Error loading model ${file}:`, error);
        throw error;
    }
});

// Apply associations after all models are loaded
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        try {
            db[modelName].associate(db);
            console.log(`Successfully associated model: ${modelName}`);
        } catch (error) {
            console.error(`Error associating model ${modelName}:`, error);
            console.error('Available models:', Object.keys(db).join(', '));
            throw error;
        }
    }
});

// Test connection and initialize tables
sequelize.authenticate()
    .then(async () => {
        console.log('Database connected successfully');
        try {
            // Sync all models - let Sequelize handle the order automatically
            // await db.sequelize.sync({ alter: true });
            console.log('Database sync skipped (migrations should be used)');
        } catch (error) {
            console.error('Database sync failed:', error);
            throw error;
        }
    })
    .catch((err) => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

module.exports = db;