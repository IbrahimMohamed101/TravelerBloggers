// تسجيل الخدمات
container.registerService('adminService', require('./services/admin/AdminService'));
container.registerService('roleService', require('./services/permission/roleService'));
container.registerService('auditService', require('./services/audit/AuditService'));

// تسجيل المتحكمات
container.registerController('adminController', require('./controllers/admin/AdminController'));

// تسجيل الـ middleware
container.registerMiddleware('adminAuth', require('./middlewares/admin/adminAuth')); 