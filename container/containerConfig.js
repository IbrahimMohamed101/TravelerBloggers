module.exports = {
    requiredModels: [
        'users',
        'audit_logs',
        'blogs',
        'categories',
        'roles',
        'permissions',
        'role_permissions'
    ],
    enableAuditLog: true,
    useRedis: true
};
