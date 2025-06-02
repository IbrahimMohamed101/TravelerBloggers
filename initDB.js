const sequelize = require('./config/sequelize');
const initModels = require('./models/init-models');

// Load all models and initialize associations using init-models.js
const models = initModels(sequelize);

// Function to initialize the database
async function initDatabase() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // Migration step: Add createdAt column to roles table safely
        // Add column as nullable with default current timestamp if not exists
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='roles' AND column_name='createdAt'
                ) THEN
                    ALTER TABLE public.roles ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now();
                END IF;
            END
            $$;
        `);

        // Update existing rows to have createdAt if null
        await sequelize.query(`
            UPDATE public.roles SET "createdAt" = now() WHERE "createdAt" IS NULL;
        `);

        // Alter column to set NOT NULL constraint
        await sequelize.query(`
            ALTER TABLE public.roles ALTER COLUMN "createdAt" SET NOT NULL;
        `);

        // Migration step: Add updatedAt column to roles table safely
        // Add column as nullable with default current timestamp if not exists
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='roles' AND column_name='updatedAt'
                ) THEN
                    ALTER TABLE public.roles ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now();
                END IF;
            END
            $$;
        `);

        // Update existing rows to have updatedAt if null
        await sequelize.query(`
            UPDATE public.roles SET "updatedAt" = now() WHERE "updatedAt" IS NULL;
        `);

        // Alter column to set NOT NULL constraint
        await sequelize.query(`
            ALTER TABLE public.roles ALTER COLUMN "updatedAt" SET NOT NULL;
        `);

        // Define sync order for tables
        const syncOrder = [
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

        // Sync tables in order with alter: true
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

// Run initialization
initDatabase();
