const express = require('express');
const router = express.Router();
const authorize = require('../../middlewares/authorization');
const verifyJWT = require('../../middlewares/verifyJWT');
const { validate } = require('../../validators/validate');
const Joi = require('joi');

module.exports = (container) => {
    const roleService = container.getService('roleService');
    const permissionService = container.getService('permissionService');

    // Role Management Routes
    router.get('/roles', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), async (req, res) => {
        try {
            const roles = await roleService.getAllRoles();
            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch roles',
                error: error.message
            });
        }
    });

    router.post('/roles', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), 
        validate(Joi.object({
            name: Joi.string().required().min(3).max(50),
            description: Joi.string().max(255),
            level: Joi.number().integer().min(0),
            parent_role_id: Joi.string().uuid(),
            metadata: Joi.object()
        })),
        async (req, res) => {
            try {
                const role = await roleService.createRole(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Role created successfully',
                    data: role
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    );

    router.put('/roles/:id', verifyJWT(), authorize({ requiredPermission: 'manage_users' }),
        validate(Joi.object({
            name: Joi.string().min(3).max(50),
            description: Joi.string().max(255),
            level: Joi.number().integer().min(0),
            parent_role_id: Joi.string().uuid(),
            metadata: Joi.object()
        })),
        async (req, res) => {
            try {
                const role = await roleService.updateRole(req.params.id, req.body);
                res.json({
                    success: true,
                    message: 'Role updated successfully',
                    data: role
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    );

    router.delete('/roles/:id', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), async (req, res) => {
        try {
            await roleService.deleteRole(req.params.id);
            res.json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Permission Management Routes
    router.get('/permissions', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), async (req, res) => {
        try {
            const permissions = await permissionService.getAllPermissions();
            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch permissions',
                error: error.message
            });
        }
    });

    router.post('/permissions', verifyJWT(), authorize({ requiredPermission: 'manage_users' }),
        validate(Joi.object({
            name: Joi.string().required().min(3).max(50),
            description: Joi.string().max(255),
            group: Joi.string().required(),
            action: Joi.string().required(),
            resource: Joi.string().required(),
            metadata: Joi.object()
        })),
        async (req, res) => {
            try {
                const permission = await permissionService.createPermission(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Permission created successfully',
                    data: permission
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
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
        async (req, res) => {
            try {
                const permission = await permissionService.updatePermission(req.params.id, req.body);
                res.json({
                    success: true,
                    message: 'Permission updated successfully',
                    data: permission
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    );

    router.delete('/permissions/:id', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), async (req, res) => {
        try {
            await permissionService.deletePermission(req.params.id);
            res.json({
                success: true,
                message: 'Permission deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Role-Permission Assignment Routes
    router.post('/roles/:roleId/permissions', verifyJWT(), authorize({ requiredPermission: 'manage_users' }),
        validate(Joi.object({
            permissionIds: Joi.array().items(Joi.string().uuid()).required()
        })),
        async (req, res) => {
            try {
                const result = await roleService.assignPermissionsToRole(req.params.roleId, req.body.permissionIds);
                res.json({
                    success: true,
                    message: 'Permissions assigned successfully',
                    data: result
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    );

    router.delete('/roles/:roleId/permissions/:permissionId', verifyJWT(), authorize({ requiredPermission: 'manage_users' }), async (req, res) => {
        try {
            await roleService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
            res.json({
                success: true,
                message: 'Permission removed successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
}; 