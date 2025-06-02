const { Sequelize } = require('sequelize');
const config = require('./config/config');

async function testConnection() {
    const sequelize = new Sequelize({
        ...config.development,
        logging: console.log
    });

    try {
        console.log('Testing database connection...');
        await sequelize.authenticate();
        console.log('✓ Database connection successful!');

        const [results] = await sequelize.query('SELECT NOW()');
        console.log('Current database time:', results[0].now);

        await sequelize.close();
    } catch (error) {
        console.error('Database connection error:', error.message);
        if (error.original) {
            console.error('Original error:', error.original);
        }
        process.exit(1);
    }
}

testConnection();
