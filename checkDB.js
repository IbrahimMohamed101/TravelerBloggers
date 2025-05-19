const sequelize = require('./config/sequelize');

// قائمة الجداول المطلوبة (نفس ترتيب الإنشاء)
const requiredTables = [
    'roles',
    'permissions',
    'role_permissions',
    'users',
    'categories',
    'tags',
    'trophies',
    'blogs',
    'posts',
    'comments',
    'reactions',
    'blog_categories',
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

async function checkTables() {
    try {
        await sequelize.authenticate();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // جلب كل الجداول الموجودة في قاعدة البيانات
        const [results] = await sequelize.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public';
        `);
        const existingTables = results.map(row => row.table_name);

        // البحث عن الجداول الناقصة
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));

        if (missingTables.length === 0) {
            console.log('🎉 كل الجداول موجودة بشكل صحيح!');
        } else {
            console.log('⚠️ الجداول الناقصة:');
            missingTables.forEach(table => console.log(`- ${table}`));
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ حدث خطأ أثناء التحقق:', error);
        process.exit(1);
    }
}

checkTables(); 