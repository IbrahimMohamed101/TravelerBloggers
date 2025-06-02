const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
    config.development.database,
    config.development.username,
    config.development.password,
    {
        host: config.development.host,
        dialect: config.development.dialect,
        logging: true, // Enable SQL logging for debugging
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// تكوين إضافي لإصلاح مشكلات مع النماذج
sequelize.options.define = sequelize.options.define || {};
sequelize.options.define.syncOnAssociation = false;
sequelize.options.define.freezeTableName = true;

module.exports = sequelize;
