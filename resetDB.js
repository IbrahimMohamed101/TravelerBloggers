// سكريبت لإعادة تعيين جدول role_permissions
const sequelize = require('./config/sequelize');

async function resetDatabase() {
    try {
        // التحقق من الاتصال بقاعدة البيانات
        await sequelize.authenticate();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // حذف جدول role_permissions تمامًا إذا كان موجودًا
        try {
            await sequelize.query('DROP TABLE IF EXISTS "public"."role_permissions" CASCADE;');
            console.log('✅ تم حذف جدول role_permissions بنجاح (إذا كان موجودًا)');
        } catch (err) {
            console.error('❌ خطأ في حذف جدول role_permissions:', err);
            throw err;
        }

        // إعادة إنشاء الجدول بالتعريف الجديد
        try {
            await sequelize.query(`
                CREATE TABLE "public"."role_permissions" (
                    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
                    "role_id" UUID NOT NULL,
                    "permission_id" UUID NOT NULL,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY ("id"),
                    CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id"),
                    FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
                );
            `);
            console.log('✅ تم إنشاء جدول role_permissions بنجاح مع التعريف الجديد');
        } catch (err) {
            console.error('❌ خطأ في إنشاء جدول role_permissions:', err);
            throw err;
        }

        // إضافة بعض صلاحيات الاختبار إلى جدول permissions إذا كان فارغًا
        const permissionCount = await sequelize.query(
            'SELECT COUNT(*) FROM "public"."permissions";',
            { type: sequelize.QueryTypes.SELECT }
        );

        if (parseInt(permissionCount[0].count) === 0) {
            console.log('جدول permissions فارغ، إضافة صلاحيات افتراضية...');
            
            // قائمة الصلاحيات من ملف constants/permissions.js
            const permissions = [
                { name: 'view_users', description: 'عرض المستخدمين', group: 'user', action: 'view', resource: 'users' },
                { name: 'create_user', description: 'إنشاء مستخدم', group: 'user', action: 'create', resource: 'users' },
                { name: 'edit_user', description: 'تعديل مستخدم', group: 'user', action: 'edit', resource: 'users' },
                { name: 'delete_user', description: 'حذف مستخدم', group: 'user', action: 'delete', resource: 'users' },
                { name: 'manage_user_roles', description: 'إدارة أدوار المستخدمين', group: 'user', action: 'manage', resource: 'user_roles' },
                { name: 'manage_user_status', description: 'إدارة حالة المستخدمين', group: 'user', action: 'manage', resource: 'user_status' },
                { name: 'view_content', description: 'عرض المحتوى', group: 'content', action: 'view', resource: 'content' },
                { name: 'create_content', description: 'إنشاء محتوى', group: 'content', action: 'create', resource: 'content' },
                { name: 'edit_content', description: 'تعديل محتوى', group: 'content', action: 'edit', resource: 'content' },
                { name: 'delete_content', description: 'حذف محتوى', group: 'content', action: 'delete', resource: 'content' },
                { name: 'approve_content', description: 'الموافقة على المحتوى', group: 'content', action: 'approve', resource: 'content' },
                { name: 'reject_content', description: 'رفض المحتوى', group: 'content', action: 'reject', resource: 'content' },
                { name: 'manage_categories', description: 'إدارة الفئات', group: 'content', action: 'manage', resource: 'categories' },
                { name: 'manage_tags', description: 'إدارة الوسوم', group: 'content', action: 'manage', resource: 'tags' },
                { name: 'view_system_settings', description: 'عرض إعدادات النظام', group: 'system', action: 'view', resource: 'system_settings' },
                { name: 'update_system_settings', description: 'تحديث إعدادات النظام', group: 'system', action: 'update', resource: 'system_settings' },
                { name: 'manage_roles', description: 'إدارة الأدوار', group: 'system', action: 'manage', resource: 'roles' },
                { name: 'manage_permissions', description: 'إدارة الصلاحيات', group: 'system', action: 'manage', resource: 'permissions' },
                { name: 'view_audit_logs', description: 'عرض سجلات التدقيق', group: 'system', action: 'view', resource: 'audit_logs' },
                { name: 'manage_backups', description: 'إدارة النسخ الاحتياطية', group: 'system', action: 'manage', resource: 'backups' },
                { name: 'manage_maintenance', description: 'إدارة الصيانة', group: 'system', action: 'manage', resource: 'maintenance' }
            ];

            // إضافة الصلاحيات إلى قاعدة البيانات
            for (const permission of permissions) {
                await sequelize.query(`
                    INSERT INTO "public"."permissions" 
                    (id, name, description, "group", action, resource, is_system, metadata, deprecated, deprecated_reason, "createdAt", "updatedAt") 
                    VALUES (uuid_generate_v4(), '${permission.name}', '${permission.description}', '${permission.group}', 
                    '${permission.action}', '${permission.resource}', false, NULL, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
                `);
            }
            console.log('✅ تم إضافة الصلاحيات الافتراضية بنجاح');
        }

        console.log('✅ تم إعادة تعيين قاعدة البيانات بنجاح');
        console.log('يمكنك الآن تشغيل التطبيق');
        process.exit(0);
    } catch (error) {
        console.error('❌ حدث خطأ أثناء إعادة تعيين قاعدة البيانات:', error);
        process.exit(1);
    }
}

resetDatabase();
