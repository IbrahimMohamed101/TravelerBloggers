BEGIN;

-- Update users with uppercase SUPER_ADMIN role to use lowercase super_admin role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin')
WHERE role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN');

-- Delete refresh tokens for affected users
DELETE FROM refresh_tokens 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
);

-- Transfer permissions from uppercase to lowercase role
INSERT INTO role_permissions (role_id, permission_id, "createdAt", "updatedAt")
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin') as role_id,
    permission_id,
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Delete role permissions for uppercase role
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN');

-- Now we can safely delete the uppercase role
DELETE FROM roles WHERE name = 'SUPER_ADMIN';

-- Update remaining role names to lowercase
UPDATE roles SET name = LOWER(name);

-- Add constraints to prevent future duplicates
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_lowercase;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_unique;
ALTER TABLE roles ADD CONSTRAINT roles_name_lowercase CHECK (name = LOWER(name));
ALTER TABLE roles ADD CONSTRAINT roles_name_unique UNIQUE (name);

-- Ensure default permissions exist
INSERT INTO permissions (id, name, action, resource, "createdAt", "updatedAt")
VALUES 
    (uuid_generate_v4(), 'manage_users', 'read-write', 'users', NOW(), NOW()),
    (uuid_generate_v4(), 'manage_roles', 'read-write', 'roles', NOW(), NOW()),
    (uuid_generate_v4(), 'manage_permissions', 'read-write', 'permissions', NOW(), NOW()),
    (uuid_generate_v4(), 'manage_categories', 'read-write', 'categories', NOW(), NOW()),
    (uuid_generate_v4(), 'create_blog', 'write', 'blogs', NOW(), NOW()),
    (uuid_generate_v4(), 'edit_blog', 'write', 'blogs', NOW(), NOW()),
    (uuid_generate_v4(), 'delete_blog', 'write', 'blogs', NOW(), NOW()),
    (uuid_generate_v4(), 'moderate_content', 'read-write', 'content', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Add basic user permissions
INSERT INTO permissions (id, name, action, resource, "createdAt", "updatedAt")
VALUES 
    (uuid_generate_v4(), 'view_blog', 'read', 'blogs', NOW(), NOW()),
    (uuid_generate_v4(), 'view_categories', 'read', 'categories', NOW(), NOW()),
    (uuid_generate_v4(), 'view_profile', 'read', 'users', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Set default permissions for roles
INSERT INTO role_permissions (role_id, permission_id, "createdAt", "updatedAt")
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE 
    (r.name = 'super_admin' AND p.name IN (
        'manage_users', 'manage_roles', 'manage_permissions',
        'manage_categories', 'create_blog', 'edit_blog',
        'delete_blog', 'moderate_content',
        'view_blog', 'view_categories', 'view_profile'
    ))
    OR (r.name = 'admin' AND p.name IN (
        'manage_users', 'view_blog', 'view_categories', 'view_profile'
    ))
    OR (r.name = 'content_manager' AND p.name IN (
        'manage_categories', 'moderate_content',
        'view_blog', 'view_categories', 'view_profile'
    ))
    OR (r.name = 'blogger' AND p.name IN (
        'create_blog', 'edit_blog',
        'view_blog', 'view_categories', 'view_profile'
    ))
    OR (r.name = 'user' AND p.name IN (
        'view_blog', 'view_categories', 'view_profile'
    ))
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
