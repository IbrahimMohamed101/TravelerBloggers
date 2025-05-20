/**
 * سكريبت بديل لتجاوز مشكلة findOrCreate مع role_permissions
 */
const sequelize = require('./config/sequelize');

// تعريف دالة مساعدة لإدارة role_permissions
async function findOrCreateRolePermission(roleId, permissionId) {
    try {
        // التحقق المباشر من وجود العلاقة
        const [result] = await sequelize.query(`
            SELECT id FROM "public"."role_permissions" 
            WHERE role_id = '${roleId}' AND permission_id = '${permissionId}'
            LIMIT 1;
        `, { type: sequelize.QueryTypes.SELECT });
        
        if (result) {
            // العلاقة موجودة بالفعل
            console.log(`العلاقة موجودة بالفعل: ${roleId} <-> ${permissionId}`);
            return [result, false];
        }
        
        // إنشاء سجل جديد
        const [newRecord] = await sequelize.query(`
            INSERT INTO "public"."role_permissions" (id, role_id, permission_id, "createdAt", "updatedAt")
            VALUES (uuid_generate_v4(), '${roleId}', '${permissionId}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, role_id, permission_id, "createdAt", "updatedAt";
        `, { type: sequelize.QueryTypes.INSERT });
        
        console.log(`تم إنشاء علاقة جديدة: ${roleId} <-> ${permissionId}`);
        return [newRecord[0], true];
    } catch (error) {
        console.error('خطأ:', error);
        throw error;
    }
}

// إنشاء العلاقات بين الأدوار والصلاحيات مباشرة
async function setupRolePermissions() {
    try {
        // الحصول على جميع الأدوار
        const roles = await sequelize.query(`
            SELECT id, name FROM "public"."roles";
        `, { type: sequelize.QueryTypes.SELECT });
        
        // الحصول على جميع الصلاحيات
        const permissions = await sequelize.query(`
            SELECT id, name FROM "public"."permissions";
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`وجدنا ${roles.length} دور و ${permissions.length} صلاحية`);
        
        // ربط دور super_admin بجميع الصلاحيات
        const superAdminRole = roles.find(r => r.name === 'super_admin');
        if (superAdminRole) {
            console.log('إعداد صلاحيات super_admin...');
            for (const permission of permissions) {
                await findOrCreateRolePermission(superAdminRole.id, permission.id);
            }
        }
        
        // ربط دور admin بالصلاحيات الأساسية
        const adminRole = roles.find(r => r.name === 'admin');
        if (adminRole) {
            console.log('إعداد صلاحيات admin...');
            const adminPermissions = ['manage_users', 'manage_content', 'view_reports'];
            for (const permName of adminPermissions) {
                const perm = permissions.find(p => p.name === permName || p.name.includes(permName));
                if (perm) {
                    await findOrCreateRolePermission(adminRole.id, perm.id);
                }
            }
        }
        
        console.log('اكتمل إعداد صلاحيات الأدوار');
    } catch (error) {
        console.error('خطأ في إعداد صلاحيات الأدوار:', error);
    }
}

// تنفيذ الإعداد
setupRolePermissions()
    .then(() => {
        console.log('تم الانتهاء من العملية بنجاح');
        process.exit(0);
    })
    .catch(err => {
        console.error('حدث خطأ:', err);
        process.exit(1);
    });
