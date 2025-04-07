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
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// تحميل الموديلات تلقائيًا
fs.readdirSync(path.join(__dirname, '../models'))
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => {
        try {
            const model = require(path.join(__dirname, '../models', file))(sequelize, Sequelize.DataTypes);
            db[model.name] = model;
        } catch (error) {
            console.error(`Error loading model ${file}:`, error);
        }
    });

// تطبيق العلاقات إن وجدت
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// اختبار الاتصال وتهيئة الجدول
sequelize.authenticate()
    .then(async () => {
        console.log('Database connected successfully');
        try {
            // Sync all models in proper order
            await db.users.sync();
            await db.blogs.sync();
            await db.posts.sync();
            await db.comments.sync();

            console.log('Database tables synchronized successfully');
        } catch (error) {
            console.error('Database sync failed:', error);
            throw error;
        }
    })
    .catch((err) => {
        console.error('Database connection error:', err);
        process.exit(1); // Exit with error code
    });

module.exports = db;
