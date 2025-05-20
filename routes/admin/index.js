// routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const blogRoutes = require('./blog');
const adminRoutes = require('./admin/adminRoutes');
const rolePermissionRoutes = require('./rolePermissionRoutes');


router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/blog', blogRoutes);
router.use('/admin', adminRoutes); // إضافة مسارات المشرفين
router.use('/admin', rolePermissionRoutes(container));


module.exports = (container) => {
    return router;
};