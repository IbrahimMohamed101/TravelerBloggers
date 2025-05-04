const { sequelize } = require('../config/database');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('تم الاتصال بقاعدة البيانات بنجاح.');

        const [results] = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
        );
        console.log('الجداول الموجودة في قاعدة البيانات:');
        results.forEach(row => console.log(row.table_name));
    } catch (error) {
        console.error('فشل الاتصال بقاعدة البيانات:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
