const express = require('express');
const router = express.Router();

// استيراد ملفات routes الفرعية
const authRoutes = require('./auth');
const userRoutes = require('./user/userRoutes');
const sessionRoutes = require('./auth/sessionRoutes');

// استخدام ملفات routes الفرعية مع البادئات المناسبة
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sessions', sessionRoutes);

module.exports = router;
