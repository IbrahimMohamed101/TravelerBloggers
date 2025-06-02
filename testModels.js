const { Sequelize } = require('sequelize');
const config = require('./config/config');
const initModels = require('./models/init-models');

async function testConnection() {
    try {
        console.log('Database config:', {
            ...config.development,
            password: '***'
        });
        
        console.log('Initializing database connection...');
        const sequelize = new Sequelize({
            ...config.development,
            logging: console.log,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });
        
        // Test database connection
        console.log('Testing connection...');
        await sequelize.authenticate();
        console.log('✓ Database connection has been established successfully.');

        // Initialize models
        const models = initModels(sequelize);
        console.log('✓ Models initialized successfully');

        // Test model sync (without applying changes)
        await sequelize.sync({ force: false, alter: false });
        console.log('✓ Models are in sync with database');        // Test simple queries first
        console.log('Testing basic queries...');
        
        const simpleRole = await models.roles.findOne();
        console.log('✓ Basic role query successful');
        
        // Now test with associations
        const roles = await models.roles.findAll({
            include: [
                { model: models.roles, as: 'parentRole' },
                { model: models.roles, as: 'childRoles' }
            ],
            limit: 1
        });
        console.log('✓ Sample query executed successfully');
        console.log('First role:', roles[0]?.get({ plain: true }) || 'No roles found');

        await sequelize.close();
        console.log('✓ Connection closed successfully');    } catch (error) {
        console.error('Error testing models:');
        console.error(error.message);
        if (error.original) {
            console.error('Original error:', error.original);
        }
        process.exit(1);
    }
}

testConnection();
