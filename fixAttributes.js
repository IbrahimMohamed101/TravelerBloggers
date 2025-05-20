/**
 * إصلاح مشكلة سمات النموذج في ذاكرة التخزين المؤقت لـ Sequelize
 */
const sequelize = require('./config/sequelize');
const path = require('path');
const fs = require('fs');

async function fixAttributes() {
    try {
        console.log('بدأ إصلاح تعريف النموذج...');
        
        // 1. تنظيف ذاكرة التخزين المؤقت لـ require
        console.log('تنظيف ذاكرة التخزين المؤقت لـ require...');
        Object.keys(require.cache).forEach(key => {
            if (key.includes('models') || key.includes('sequelize')) {
                delete require.cache[key];
            }
        });
        
        // 2. إعادة كتابة النموذج بتعريف دقيق جدًا
        console.log('إعادة كتابة نموذج role_permissions...');
        const modelFile = path.join(__dirname, 'models', 'role_permissions.js');
        
        const modelContent = `const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const RolePermissions = sequelize.define('role_permissions', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        role_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id'
            }
        },
        permission_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'permissions',
                key: 'id'
            }
        }
    }, {
        sequelize,
        tableName: 'role_permissions',
        schema: 'public',
        timestamps: true,
        freezeTableName: true,
        underscored: false
    });

    // تحديد بشكل صريح جدًا أن هذا النموذج ليس لديه عمود 'role'
    RolePermissions.removeAttribute('role');

    RolePermissions.associate = function (models) {
        RolePermissions.belongsTo(models.permissions, {
            foreignKey: 'permission_id',
            targetKey: 'id',
            as: 'permission'
        });
        
        RolePermissions.belongsTo(models.roles, {
            foreignKey: 'role_id',
            targetKey: 'id',
            as: 'role'
        });
    };

    return RolePermissions;
};`;
        
        // احتياطي للملف الأصلي
        fs.copyFileSync(modelFile, modelFile + '.bak.' + Date.now());
        
        // كتابة الملف الجديد
        fs.writeFileSync(modelFile, modelContent);
        console.log('✓ تم تحديث ملف role_permissions.js');
        
        // 3. إنشاء نسخة معدلة من findOrCreate
        console.log('إنشاء سكريبت بديل للبحث عن/إنشاء العلاقات...');
        
        // إنشاء ملف لإصلاح دالة findOrCreate
        const patchFile = path.join(__dirname, 'patchFindOrCreate.js');
        const patchContent = `/**
 * سكريبت بديل لتجاوز مشكلة findOrCreate مع role_permissions
 */
const sequelize = require('./config/sequelize');

// تعريف دالة مساعدة لإدارة role_permissions
async function findOrCreateRolePermission(roleId, permissionId) {
    try {
        // التحقق المباشر من وجود العلاقة
        const [result] = await sequelize.query(\`
            SELECT id FROM "public"."role_permissions" 
            WHERE role_id = '\${roleId}' AND permission_id = '\${permissionId}'
            LIMIT 1;
        \`, { type: sequelize.QueryTypes.SELECT });
        
        if (result) {
            // العلاقة موجودة بالفعل
            console.log(\`العلاقة موجودة بالفعل: \${roleId} <-> \${permissionId}\`);
            return [result, false];
        }
        
        // إنشاء سجل جديد
        const [newRecord] = await sequelize.query(\`
            INSERT INTO "public"."role_permissions" (id, role_id, permission_id, "createdAt", "updatedAt")
            VALUES (uuid_generate_v4(), '\${roleId}', '\${permissionId}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, role_id, permission_id, "createdAt", "updatedAt";
        \`, { type: sequelize.QueryTypes.INSERT });
        
        console.log(\`تم إنشاء علاقة جديدة: \${roleId} <-> \${permissionId}\`);
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
        const roles = await sequelize.query(\`
            SELECT id, name FROM "public"."roles";
        \`, { type: sequelize.QueryTypes.SELECT });
        
        // الحصول على جميع الصلاحيات
        const permissions = await sequelize.query(\`
            SELECT id, name FROM "public"."permissions";
        \`, { type: sequelize.QueryTypes.SELECT });
        
        console.log(\`وجدنا \${roles.length} دور و \${permissions.length} صلاحية\`);
        
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
`;
        
        fs.writeFileSync(patchFile, patchContent);
        console.log('✓ تم إنشاء سكريبت patchFindOrCreate.js');
        
        // 4. إنشاء سكريبت تعديل لملف roleService.js
        console.log('إنشاء تعديل لملف roleService.js...');
        
        const roleServiceFile = path.join(__dirname, 'services', 'permission', 'roleService.js');
        let roleServiceContent = fs.readFileSync(roleServiceFile, 'utf8');
        
        // حفظ نسخة احتياطية
        fs.copyFileSync(roleServiceFile, roleServiceFile + '.bak.' + Date.now());
        
        // تعديل الكود للتعامل مع حالة الخطأ بشكل أفضل
        const updatedRoleServiceContent = roleServiceContent.replace(
            /async initializeRolePermissions\(\) {[\s\S]*?try {[\s\S]*?for \(const roleData of Object\.values\(DEFAULT_ROLES\)\) {[\s\S]*?const \[roleInstance\] = await this\.db\.roles\.findOrCreate\({[\s\S]*?for \(const permissionName of roleData\.permissions\) {[\s\S]*?const permission = await this\.db\.permissions\.findOne\({[\s\S]*?where: { name: permissionName }[\s\S]*?}\);[\s\S]*?if \(permission\) {[\s\S]*?await this\.db\.role_permissions\.findOrCreate\({[\s\S]*?where: {[\s\S]*?role_id: roleInstance\.id,[\s\S]*?permission_id: permission\.id[\s\S]*?}[\s\S]*?}\);/,
            `async initializeRolePermissions() {
        try {
            logger.info('Starting role permissions initialization');

            for (const roleData of Object.values(DEFAULT_ROLES)) {
                // Find or create the role
                const [roleInstance] = await this.db.roles.findOrCreate({
                    where: { name: roleData.name },
                    defaults: {
                        name: roleData.name,
                        description: roleData.description
                    }
                });

                // Process each permission for the role
                for (const permissionName of roleData.permissions) {
                    // Find the permission
                    const permission = await this.db.permissions.findOne({ 
                        where: { name: permissionName }
                    });
                    
                    if (permission) {
                        try {
                            // استخدام استعلام مباشر بدلاً من النموذج
                            await this.db.sequelize.query(\`
                                INSERT INTO "public"."role_permissions" (id, role_id, permission_id, "createdAt", "updatedAt")
                                VALUES (uuid_generate_v4(), '\${roleInstance.id}', '\${permission.id}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                                ON CONFLICT (role_id, permission_id) DO NOTHING;
                            \`);
                            logger.info(\`Associated role \${roleData.name} with permission \${permissionName}\`);
                        } catch (error) {
                            logger.error(\`Error associating role \${roleData.name} with permission \${permissionName}: \${error.message}\`);
                        }`
        );
        
        fs.writeFileSync(roleServiceFile, updatedRoleServiceContent);
        console.log('✓ تم تحديث ملف roleService.js');
        
        console.log('\n');
        console.log('✓ تم إكمال الإصلاحات بنجاح');
        console.log('خطوات التشغيل:');
        console.log('1. قم بتنفيذ patchFindOrCreate.js: node patchFindOrCreate.js');
        console.log('2. أعد تشغيل التطبيق: npm start');
        
        process.exit(0);
    } catch (error) {
        console.error('حدث خطأ:', error);
        process.exit(1);
    }
}

fixAttributes();
