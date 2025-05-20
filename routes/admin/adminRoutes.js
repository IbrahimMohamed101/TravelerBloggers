// routes/admin/adminRoutes.js
const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middlewares/verifyJWT');
const authorize = require('../../middlewares/authorization');
const { validate } = require('../../validators/validate');
const Joi = require('joi');
const { validateRequest } = require('../../middlewares/validation');
const { PERMISSIONS } = require('../../constants/permissions');

module.exports = (container) => {
    const adminController = container.getController('adminController');
    const adminAuth = container.getMiddleware('adminAuth');

    // Middleware للتحقق من صلاحيات المشرف
    const requireAdmin = authorize({ requiredPermission: 'manage_users' });
    const requireSuperAdmin = authorize({ requiredPermission: 'manage_system' });

    // مسارات إدارة المستخدمين
    router.get('/users',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().allow(''),
            role: Joi.string(),
            status: Joi.string().valid('active', 'inactive')
        }), 'query'),
        adminController.getUsers
    );

    // مسارات إدارة المشرفين
    router.post(
        '/',
        adminAuth.requirePermission(PERMISSIONS.ADMIN_MANAGEMENT.CREATE_ADMIN),
        validateRequest(schemas.createAdmin),
        adminController.createAdmin
    );

    router.put(
        '/:adminId',
        adminAuth.requirePermission(PERMISSIONS.ADMIN_MANAGEMENT.EDIT_ADMIN),
        validateRequest(schemas.updateAdmin),
        adminController.updateAdmin
    );

    router.delete(
        '/:adminId',
        adminAuth.requirePermission(PERMISSIONS.ADMIN_MANAGEMENT.DELETE_ADMIN),
        adminController.deleteAdmin
    );

    router.get(
        '/',
        adminAuth.requirePermission(PERMISSIONS.ADMIN_MANAGEMENT.VIEW_ADMINS),
        validateRequest(schemas.getAdmins, 'query'),
        adminController.getAdmins
    );

    router.get(
        '/:adminId',
        adminAuth.requirePermission(PERMISSIONS.ADMIN_MANAGEMENT.VIEW_ADMINS),
        adminController.getAdmin
    );

    router.patch(
        '/:adminId/status',
        adminAuth.requirePermission(PERMISSIONS.ADMIN_MANAGEMENT.MANAGE_ADMIN_STATUS),
        adminController.toggleAdminStatus
    );

    // مسار إنشاء المشرف الرئيسي الأول
    router.post(
        '/first-super-admin',
        validateRequest(schemas.createAdmin),
        adminController.createFirstSuperAdmin
    );

    // مسارات إدارة النظام
    router.get('/system/status',
        verifyJWT(),
        requireSuperAdmin,
        adminController.getSystemStatus
    );

    router.put('/system/settings',
        verifyJWT(),
        requireSuperAdmin,
        validate(Joi.object({
            maintenance_mode: Joi.boolean(),
            registration_enabled: Joi.boolean(),
            max_login_attempts: Joi.number().integer().min(1),
            session_timeout: Joi.number().integer().min(300)
        })),
        adminController.updateSystemSettings
    );

    // مسارات إدارة المحتوى
    router.get('/content/reports',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            status: Joi.string().valid('pending', 'resolved', 'rejected')
        }), 'query'),
        adminController.getContentReports
    );

    router.put('/content/:contentId/moderate',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            action: Joi.string().valid('approve', 'reject', 'delete').required(),
            reason: Joi.string().when('action', {
                is: 'reject',
                then: Joi.string().required(),
                otherwise: Joi.string().optional()
            })
        })),
        adminController.moderateContent
    );

    // مسارات الإحصائيات والتقارير
    router.get('/analytics/overview',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            period: Joi.string().valid('day', 'week', 'month', 'year').default('week')
        }), 'query'),
        adminController.getAnalyticsOverview
    );

    router.get('/analytics/users',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            period: Joi.string().valid('day', 'week', 'month', 'year').default('week'),
            groupBy: Joi.string().valid('day', 'week', 'month').default('day')
        }), 'query'),
        adminController.getUserAnalytics
    );

    return router;
};