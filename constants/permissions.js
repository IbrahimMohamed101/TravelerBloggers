/**
 * تعريف جميع صلاحيات النظام
 */
const PERMISSIONS = {
    // صلاحيات إدارة المستخدمين
    USER_MANAGEMENT: {
        VIEW_USERS: 'view_users',
        CREATE_USER: 'create_user',
        EDIT_USER: 'edit_user',
        DELETE_USER: 'delete_user',
        MANAGE_USER_ROLES: 'manage_user_roles',
        MANAGE_USER_STATUS: 'manage_user_status'
    },

    // صلاحيات إدارة المحتوى
    CONTENT_MANAGEMENT: {
        VIEW_CONTENT: 'view_content',
        CREATE_CONTENT: 'create_content',
        EDIT_CONTENT: 'edit_content',
        DELETE_CONTENT: 'delete_content',
        APPROVE_CONTENT: 'approve_content',
        REJECT_CONTENT: 'reject_content',
        MANAGE_CATEGORIES: 'manage_categories',
        MANAGE_TAGS: 'manage_tags'
    },

    // صلاحيات إدارة النظام
    SYSTEM_MANAGEMENT: {
        VIEW_SYSTEM_SETTINGS: 'view_system_settings',
        UPDATE_SYSTEM_SETTINGS: 'update_system_settings',
        MANAGE_ROLES: 'manage_roles',
        MANAGE_PERMISSIONS: 'manage_permissions',
        VIEW_AUDIT_LOGS: 'view_audit_logs',
        MANAGE_BACKUPS: 'manage_backups',
        MANAGE_MAINTENANCE: 'manage_maintenance'
    },

    // صلاحيات إدارة المشرفين
    ADMIN_MANAGEMENT: {
        VIEW_ADMINS: 'view_admins',
        CREATE_ADMIN: 'create_admin',
        EDIT_ADMIN: 'edit_admin',
        DELETE_ADMIN: 'delete_admin',
        MANAGE_ADMIN_ROLES: 'manage_admin_roles',
        MANAGE_ADMIN_PERMISSIONS: 'manage_admin_permissions'
    },

    // صلاحيات التقارير والإحصائيات
    REPORTS: {
        VIEW_REPORTS: 'view_reports',
        GENERATE_REPORTS: 'generate_reports',
        EXPORT_REPORTS: 'export_reports',
        VIEW_ANALYTICS: 'view_analytics'
    }
};

/**
 * تعريف الأدوار الافتراضية وصلاحياتها
 */
const DEFAULT_ROLES = {
    SUPER_ADMIN: {
        name: 'super_admin',
        description: 'super admin',
        permissions: Object.values(PERMISSIONS).flatMap(category => 
            Object.values(category)
        )
    },
    ADMIN: {
        name: 'admin',
        description: 'admin',
        permissions: [
            // صلاحيات إدارة المستخدمين
            PERMISSIONS.USER_MANAGEMENT.VIEW_USERS,
            PERMISSIONS.USER_MANAGEMENT.EDIT_USER,
            PERMISSIONS.USER_MANAGEMENT.MANAGE_USER_STATUS,

            // صلاحيات إدارة المحتوى
            ...Object.values(PERMISSIONS.CONTENT_MANAGEMENT),

            // صلاحيات النظام الأساسية
            PERMISSIONS.SYSTEM_MANAGEMENT.VIEW_SYSTEM_SETTINGS,
            PERMISSIONS.SYSTEM_MANAGEMENT.VIEW_AUDIT_LOGS,

            // صلاحيات التقارير
            ...Object.values(PERMISSIONS.REPORTS)
        ]
    },
    CONTENT_MANAGER: {
        name: 'content_manager',
        description: 'content Manager',
        permissions: [
            // صلاحيات إدارة المحتوى
            ...Object.values(PERMISSIONS.CONTENT_MANAGEMENT),
            
            // صلاحيات التقارير الأساسية
            PERMISSIONS.REPORTS.VIEW_REPORTS,
            PERMISSIONS.REPORTS.VIEW_ANALYTICS
        ]
    }
};

module.exports = {
    PERMISSIONS,
    DEFAULT_ROLES
}; 