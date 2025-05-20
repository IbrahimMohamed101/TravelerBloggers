/**
 * إصلاح مشكلة تعريف نموذج role_permissions
 */
const fs = require('fs');
const path = require('path');

// إصلاح تعريف النموذج
const modelFile = path.join(__dirname, 'models', 'role_permissions.js');
let modelCode = fs.readFileSync(modelFile, 'utf8');

// التأكد من أن النموذج يستخدم role_id فقط وليس role
if (modelCode.includes('role: {')) {
    console.log('تحديث نموذج role_permissions...');
    
    // احتياطي للملف الأصلي
    fs.writeFileSync(modelFile + '.bak', modelCode);
    
    // التأكد من إزالة أي إشارات إلى عمود role
    const updatedCode = `const Sequelize = require('sequelize');

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
        underscored: false,
        freezeTableName: true,
        indexes: [
            {
                name: 'role_permissions_pkey',
                unique: true,
                fields: [{ name: 'id' }]
            },
            {
                name: 'role_permissions_role_id_permission_id_key',
                unique: true,
                fields: ['role_id', 'permission_id']
            }
        ]
    });

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
    
    // كتابة الكود المحدث
    fs.writeFileSync(modelFile, updatedCode);
    console.log('تم تحديث النموذج بنجاح');
} else {
    console.log('النموذج محدث بالفعل');
}

// إصلاح ملف initServices.js إذا كان يستخدم role بدلاً من role_id
const initServicesFile = path.join(__dirname, 'container', 'initServices.js');
if (fs.existsSync(initServicesFile)) {
    let initServicesCode = fs.readFileSync(initServicesFile, 'utf8');
    
    // احتياطي للملف الأصلي
    fs.writeFileSync(initServicesFile + '.bak', initServicesCode);
    
    // تعديل أي استخدام role: roleName إلى role_id: roleInstance.id
    initServicesCode = initServicesCode.replace(/role:\s*([^,\s}]+)/g, 'role_id: $1Id');
    
    // كتابة الكود المحدث
    fs.writeFileSync(initServicesFile, initServicesCode);
    console.log('تم تحديث ملف initServices.js بنجاح');
}

// ضبط Sequelize بعيدًا عن الذاكرة المخبأة
const sequelizeFile = path.join(__dirname, 'config', 'sequelize.js');
if (fs.existsSync(sequelizeFile)) {
    let sequelizeCode = fs.readFileSync(sequelizeFile, 'utf8');
    
    // احتياطي للملف الأصلي
    fs.writeFileSync(sequelizeFile + '.bak', sequelizeCode);
    
    // إضافة خيار define.syncOnAssociation: false لمنع الـ sync التلقائي
    if (!sequelizeCode.includes('syncOnAssociation')) {
        sequelizeCode = sequelizeCode.replace(
            'const sequelize = new Sequelize(',
            'const sequelize = new Sequelize('
        );
        
        // إضافة خيارات إضافية لتصحيح سلوك Sequelize
        if (sequelizeCode.includes('module.exports = sequelize;')) {
            sequelizeCode = sequelizeCode.replace(
                'module.exports = sequelize;',
                `// تكوين إضافي لإصلاح مشكلات مع النماذج
sequelize.options.define = sequelize.options.define || {};
sequelize.options.define.syncOnAssociation = false;
sequelize.options.define.freezeTableName = true;

module.exports = sequelize;`
            );
        }
        
        // كتابة الكود المحدث
        fs.writeFileSync(sequelizeFile, sequelizeCode);
        console.log('تم تحديث ملف sequelize.js بنجاح');
    }
}

// إنشاء سكريبت SQL للتعديل المباشر للجدول
const sqlFile = path.join(__dirname, 'fix_role_permissions.sql');
const sqlContent = `-- تعديل جدول role_permissions
DROP TABLE IF EXISTS "public"."role_permissions" CASCADE;

-- إعادة إنشاء الجدول مع التعريف الصحيح
CREATE TABLE "public"."role_permissions" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "role_id" UUID NOT NULL REFERENCES "public"."roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "permission_id" UUID NOT NULL REFERENCES "public"."permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("role_id", "permission_id")
);

-- إضافة صلاحيات جديدة لاختبار النظام
INSERT INTO "public"."permissions" (id, name, description, "group", action, resource, is_system, "createdAt", "updatedAt")
VALUES 
(uuid_generate_v4(), 'manage_users', 'إدارة المستخدمين', 'users', 'manage', 'users', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'manage_roles', 'إدارة الأدوار', 'system', 'manage', 'roles', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'manage_permissions', 'إدارة الصلاحيات', 'system', 'manage', 'permissions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- ربط صلاحيات بالأدوار
INSERT INTO "public"."role_permissions" (id, role_id, permission_id, "createdAt", "updatedAt")
SELECT 
    uuid_generate_v4(), 
    r.id, 
    p.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM 
    "public"."roles" r,
    "public"."permissions" p
WHERE 
    r.name = 'super_admin' AND p.name = 'manage_roles'
ON CONFLICT (role_id, permission_id) DO NOTHING;
`;
fs.writeFileSync(sqlFile, sqlContent);
console.log('تم إنشاء ملف SQL لإصلاح الجدول');

console.log('\n');
console.log('لتطبيق الإصلاح النهائي، قم بما يلي:');
console.log('1. قم بتنفيذ ملف SQL على قاعدة البيانات PostgreSQL');
console.log('2. أعد تشغيل التطبيق');
console.log('\n');
console.log('اكتمل الإصلاح!');
