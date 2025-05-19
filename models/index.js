const initModels = require('./init-models'); // تأكد من المسار الصحيح

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
});

const models = initModels(sequelize); // استدعاء الدالة بشكل صحيح

module.exports = models;  // تصدير الموديلات
