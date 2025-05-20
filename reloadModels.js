// سكريبت لإعادة تحميل النماذج وإعادة تهيئة قاعدة البيانات
const sequelize = require('./config/sequelize');
const fs = require('fs');
const path = require('path');

// حذف ذاكرة التخزين المؤقت من require
Object.keys(require.cache).forEach(key => {
    if (key.includes('models')) {
        delete require.cache[key];
    }
});

async function clearDB() {
    try {
        // اختبار الاتصال بقاعدة البيانات
        await sequelize.authenticate();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // إنشاء النماذج من جديد
        const models = {};
        fs.readdirSync(path.join(__dirname, 'models'))
            .filter(file => file.endsWith('.js') && file !== 'index.js' && file !== 'init-models.js')
            .forEach(file => {
                const model = require(path.join(__dirname, 'models', file))(sequelize, sequelize.Sequelize.DataTypes);
                models[model.name] = model;
            });

        // تطبيق العلاقات
        Object.keys(models).forEach(modelName => {
            if (models[modelName].associate) {
                models[modelName].associate(models);
            }
        });

        // جدول role_permissions تحديدًا
        await sequelize.queryInterface.describeTable('role_permissions')
            .then(tableDefinition => {
                console.log('تعريف جدول role_permissions:');
                console.log(tableDefinition);
            })
            .catch(err => {
                console.error('خطأ في استعلام تعريف الجدول:', err);
            });

        // تعطيل الواجهة المتقدمة للنماذج المسببة للمشكلة
        try {
            await sequelize.query('TRUNCATE "role_permissions" RESTART IDENTITY CASCADE;');
            console.log('✅ تم تفريغ جدول role_permissions بنجاح');
        } catch (err) {
            console.error('❌ خطأ في تفريغ جدول role_permissions:', err);
        }

        console.log('✅ تم إعادة تحميل النماذج بنجاح');
        process.exit(0);
    } catch (error) {
        console.error('❌ حدث خطأ أثناء إعادة تحميل النماذج:', error);
        process.exit(1);
    }
}

clearDB();
