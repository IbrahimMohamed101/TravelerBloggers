const { Sequelize } = require('sequelize');
require('dotenv').config();
const initModels = require('./models/init-models');

const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
});

const models = initModels(sequelize);

const init = async () => {
    try {
        // ✅ الجداول الأساسية
        await models.users.sync({ force: true });
        await models.guest_users.sync({ force: true });
        await models.categories.sync({ force: true });
        await models.trophies.sync({ force: true });

        // ✅ الجداول المرتبطة بالمدونات والمقالات
        await models.blogs.sync({ force: true });
        await models.posts.sync({ force: true });

        // ✅ الجداول الوسيطة
        await models.blog_categories.sync({ force: true });

        // ✅ الجداول اللي بتحتوي على علاقات وردود فعل
        await models.comments.sync({ force: true });
        await models.reactions.sync({ force: true });
        await models.comment_reactions.sync({ force: true });
        await models.post_reactions.sync({ force: true });
        await models.blog_reactions.sync({ force: true });

        // ✅ الجداول الإضافية المرتبطة بالمستخدمين
        await models.followers.sync({ force: true });
        await models.contact_messages.sync({ force: true });
        await models.notifications.sync({ force: true });
        await models.user_trophies.sync({ force: true });
        await models.admin_logs.sync({ force: true });
        await models.audit_logs.sync({ force: true });
        await models.permissions.sync({ force: true });
        await models.sessions.sync({ force: true });

        // ✅ جداول السفر وخطط الرحلات
        await models.travel_plans.sync({ force: true });
        await models.travel_plan_locations.sync({ force: true });
        await models.travel_plan_shares.sync({ force: true });

        // ✅ جدول الأحداث
        await models.events.sync({ force: true });

        console.log("✅ All tables synced successfully.");
    } catch (error) {
        console.error("❌ Sync error:", error);
    } finally {
        await sequelize.close();
        console.log("✅ Connection closed.");
        process.exit();
    }
};

init();
