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
        logging: false, // ممكن تخليه true لو عايز تشوف SQL اللي بتتنفذ
    }
);

// تكوين إضافي لإصلاح مشكلات مع النماذج
sequelize.options.define = sequelize.options.define || {};
sequelize.options.define.syncOnAssociation = false;
sequelize.options.define.freezeTableName = true;

module.exports = sequelize;
