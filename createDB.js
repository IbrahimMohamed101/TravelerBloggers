const { Sequelize } = require('sequelize');
const config = require('./config/config');

async function createDatabase() {
    // Connect to postgres database to create our app database
    const sequelize = new Sequelize({
        dialect: 'postgres',
        host: config.development.host,
        port: config.development.port || 5432,
        username: config.development.username,
        password: config.development.password,
        database: 'postgres' // Connect to default postgres database
    });

    try {
        // Create the database if it doesn't exist
        await sequelize.query(`CREATE DATABASE "${config.development.database}"`);
        console.log(`Database ${config.development.database} created successfully`);
    } catch (error) {
        if (error.name === 'SequelizeDatabaseError') {
            console.log('Database already exists, continuing...');
        } else {
            console.error('Error creating database:', error);
        }
    } finally {
        await sequelize.close();
    }
}

createDatabase();
