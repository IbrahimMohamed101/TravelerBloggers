const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/authorization');
const verifyJWT = require('../../middlewares/verifyJWT');
const { validate } = require('../../validators/validate');
const Joi = require('joi');

module.exports = (container) => {
    // استخدام المتحكم الجديد بدلاً من التعامل المباشر مع الخدمات
    const rolePermissionController = container.getController('rolePermissionController');

    // Role Management Routes
    router.get('/roles', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), rolePermissionController.getAllRoles);

    router.post('/roles', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), 
        validate(Joi.object({
            name: Joi.string().required().min(3).max(50),
            description: Joi.string().max(255),
            level: Joi.number().integer().min(0),
            parent_role_id: Joi.string().uuid(),
            metadata: Joi.object()
        })),
        rolePermissionController.createRole
    );

    router.put('/roles/:id', verifyJWT(), authorize({ requiredPermission: 'manage_users' }),
        validate(Joi.object({
            name: Joi.string().min(3).max(50),
            description: Joi.string().max(255),
            level: Joi.number().integer().min(0),
            parent_role_id: Joi.string().uuid(),
            metadata: Joi.object()
        })),
        rolePermissionController.updateRole
    );

    router.delete('/roles/:id', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), rolePermissionController.deleteRole);

    // Permission Management Routes
    router.get('/permissions', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), rolePermissionController.getAllPermissions);

    router.post('/permissions', verifyJWT(), authorize({ requiredPermission: 'manage_users' }),
        validate(Joi.object({
            name: Joi.string().required().min(3).max(50),
            description: Joi.string().max(255),
            group: Joi.string().required(),
            action: Joi.string().required(),
            resource: Joi.string().required(),
            metadata: Joi.object()
        })),
        rolePermissionController.createPermission
    );

    router.put('/permissions/:id', verifyJWT(), authorize({ requiredPermission: 'manage_users' }),
        validate(Joi.object({
            name: Joi.string().min(3).max(50),
            description: Joi.string().max(255),
            group: Joi.string(),
            action: Joi.string(),
            resource: Joi.string(),
            metadata: Joi.object(),
            deprecated: Joi.boolean(),
            deprecated_reason: Joi.string().max(255)
        })),
        rolePermissionController.updatePermission
    );

    router.delete('/permissions/:id', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), rolePermissionController.deletePermission);

    // Role-Permission Assignment Routes
    router.post('/roles/:roleId/permissions', verifyJWT(), authorize({ requiredPermission: 'manage_users' }),
        validate(Joi.object({
            permissionIds: Joi.array().items(Joi.string().uuid()).required()
        })),
        rolePermissionController.assignPermissionsToRole
    );

    router.delete('/roles/:roleId/permissions/:permissionId', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), rolePermissionController.removePermissionFromRole);

    // Fix duplicate roles route
    router.post('/fix-duplicate-roles', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), rolePermissionController.fixDuplicateRoles);

    return router;
};