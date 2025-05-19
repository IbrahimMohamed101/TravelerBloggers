const sequelize = require('./config/sequelize');
const fs = require('fs');
const path = require('path');

// تحميل جميع الموديلز
const models = {};
fs.readdirSync(path.join(__dirname, 'models'))
    .filter(file => file.endsWith('.js') && file !== 'index.js' && file !== 'init-models.js')
    .forEach(file => {
        const model = require(path.join(__dirname, 'models', file))(sequelize, sequelize.Sequelize.DataTypes);
        models[model.name] = model;
    });

// تطبيق العلاقات بين الجداول
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// دالة لتهيئة قاعدة البيانات
async function initDatabase() {
    try {
        // اختبار الاتصال بقاعدة البيانات
        await sequelize.authenticate();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // ترتيب إنشاء الجداول
        const syncOrder = [
            'roles',           // يجب إنشاء جدول الأدوار أولاً
            'permissions',     // ثم جدول الصلاحيات
            'role_permissions', // ثم جدول العلاقة بين الأدوار والصلاحيات
            'users',          // ثم جدول المستخدمين
            'categories',     // ثم جدول التصنيفات
            'tags',
            'trophies',       // ثم جدول الجوائز
            'blogs',          // ثم جدول المدونات
            'posts',          // ثم جدول المنشورات
            'comments',       // ثم جدول التعليقات
            'reactions',      // ثم جدول التفاعلات
            'blog_categories', // ثم الجداول الوسيطة
            'blog_tags',
            'blog_reactions',
            'post_reactions',
            'comment_reactions',
            'user_trophies',
            'followers',
            'travel_plans',
            'travel_plan_locations',
            'travel_plan_shares',
            'events',
            'notifications',
            'contact_messages',
            'admin_logs',
            'audit_logs',
            'sessions',
            'refresh_tokens',
            'email_verification_tokens',
            'password_reset_tokens',
            'guest_users'
        ];

        // إنشاء الجداول بالترتيب
        for (const modelName of syncOrder) {
            if (models[modelName]) {
                console.log(`🔄 جاري إنشاء جدول ${modelName}...`);
                await models[modelName].sync({ alter: true });
                console.log(`✅ تم إنشاء جدول ${modelName} بنجاح`);
            }
        }

        console.log('✅ تم إنشاء/تحديث جميع الجداول بنجاح');
        process.exit(0);
    } catch (error) {
        console.error('❌ حدث خطأ أثناء تهيئة قاعدة البيانات:', error);
        process.exit(1);
    }
}

// تشغيل عملية التهيئة
initDatabase();
