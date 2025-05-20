-- تعديل جدول role_permissions
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
