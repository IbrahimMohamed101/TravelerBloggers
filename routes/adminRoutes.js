const express = require('express');
const router = express.Router();
const AdminService = require('../services/adminService');
const authorize = require('../middlewares/authorization');
const logger = require('../utils/logger');

const adminService = new AdminService();

// Get all users (for admin only)
router.get('/users', authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const users = await adminService.getAllUsers(page, limit);
        res.json({
            success: true,
            data: users.rows,
            total: users.count,
            page: parseInt(page),
            totalPages: Math.ceil(users.count / limit)
        });
    } catch (error) {
        logger.error(`Admin users list error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// Update user role (for super_admin only)
router.put('/users/:id/role', authorize('super_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is required'
            });
        }

        const user = await adminService.updateUserRole(id, role);
        res.json({
            success: true,
            message: 'User role updated successfully',
            data: {
                id: user.id,
                role: user.role
            }
        });
    } catch (error) {
        logger.error(`Update user role error: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Toggle user active status (for admin only)
router.put('/users/:id/status', authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await adminService.toggleUserStatus(id);
        res.json({
            success: true,
            message: 'User status updated successfully',
            data: {
                id: user.id,
                is_active: user.is_active
            }
        });
    } catch (error) {
        logger.error(`Toggle user status error: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Create new permission (for super_admin only)
router.post('/permissions', authorize('super_admin'), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Permission name is required'
            });
        }

        const permission = await adminService.createPermission({ name, description });
        res.status(201).json({
            success: true,
            message: 'Permission created successfully',
            data: permission
        });
    } catch (error) {
        logger.error(`Create permission error: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
