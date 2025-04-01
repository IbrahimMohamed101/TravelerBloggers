const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 20,
            min: 0,
            acquire: 30000,
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

// اختبار الاتصال
sequelize.authenticate()
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error('Database connection error:', err));

module.exports = db;