// routes/admin/adminRoutes.js
const express = require('express');
const verifyJWT = require('../../middlewares/verifyJWT');
const authorize = require('../../middlewares/authorization');
const { validate } = require('../../validators/validate');
const Joi = require('joi');
const { PERMISSIONS } = require('../../constants/permissions');

module.exports = (container) => {
    if (!container) {
        throw new Error('Container is required to initialize admin routes');
    }

    const router = express.Router();
    const adminController = container.resolve('adminController');

    if (!adminController) {
        throw new Error('AdminController could not be resolved from container');
    }

    // Helper function to wrap controller methods
    const wrapRoute = (method) => (req, res, next) => {
        return adminController[method](req, res, next);
    };

    // Authorization middleware
    const requireAdmin = authorize({ requiredPermission: 'manage_users' });
    const requireSuperAdmin = authorize({ requiredPermission: 'manage_system' });

    // User management routes
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
        wrapRoute('getUsers')
    );

    // Admin management routes
    router.post('/',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            first_name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required()
        })),
        wrapRoute('createAdmin')
    );

    router.put('/:adminId',
        verifyJWT(),
        authorize({ requiredPermission: PERMISSIONS.ADMIN_MANAGEMENT.EDIT_ADMIN }),
        validate(Joi.object({
            first_name: Joi.string(),
            email: Joi.string().email(),
            role: Joi.string()
        })),
        wrapRoute('updateAdmin')
    );

    router.delete('/:adminId',
        verifyJWT(),
        authorize({ requiredPermission: PERMISSIONS.ADMIN_MANAGEMENT.DELETE_ADMIN }),
        wrapRoute('deleteAdmin')
    );

    router.get('/',
        verifyJWT(),
        authorize({ requiredPermission: PERMISSIONS.ADMIN_MANAGEMENT.VIEW_ADMINS }),
        validate(Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().allow(''),
            status: Joi.string()
        }), 'query'),
        wrapRoute('getAdmins')
    );

    router.get('/:adminId',
        verifyJWT(),
        authorize({ requiredPermission: PERMISSIONS.ADMIN_MANAGEMENT.VIEW_ADMINS }),
        wrapRoute('getAdmin')
    );

    router.patch('/:adminId/status',
        verifyJWT(),
        authorize({ requiredPermission: PERMISSIONS.ADMIN_MANAGEMENT.MANAGE_ADMIN_STATUS }),
        validate(Joi.object({
            status: Joi.string().valid('active', 'inactive').required()
        })),
        wrapRoute('toggleAdminStatus')
    );

    router.post('/first-super-admin',
        validate(Joi.object({
            first_name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required()
        })),
        wrapRoute('createFirstSuperAdmin')
    );

    // System management routes
    router.get('/system/status',
        verifyJWT(),
        requireSuperAdmin,
        wrapRoute('getSystemStatus')
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
        wrapRoute('updateSystemSettings')
    );

    // Content management routes
    router.get('/content/reports',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            status: Joi.string().valid('pending', 'resolved', 'rejected')
        }), 'query'),
        wrapRoute('getContentReports')
    );

    router.put('/content/:contentId/moderate',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            action: Joi.string().valid('approve', 'reject', 'delete').required(),
            reason: Joi.when('action', {
                is: 'reject',
                then: Joi.string().required(),
                otherwise: Joi.string().optional()
            })
        })),
        wrapRoute('moderateContent')
    );

    // Analytics routes
    router.get('/analytics/overview',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            period: Joi.string().valid('day', 'week', 'month', 'year').default('week')
        }), 'query'),
        wrapRoute('getAnalyticsOverview')
    );

    router.get('/analytics/users',
        verifyJWT(),
        requireAdmin,
        validate(Joi.object({
            period: Joi.string().valid('day', 'week', 'month', 'year').default('week'),
            groupBy: Joi.string().valid('day', 'week', 'month').default('day')
        }), 'query'),
        wrapRoute('getUserAnalytics')
    );

    return router;
};