const express = require('express');
const router = express.Router()
const container = require('../config/container');
const { validateRegister, validateLogin } = require('../middlewares/validate');
const verifyJWT = require('../middlewares/verifyJWT');
const authController = container.getController('authController');

// تسجيل مستخدم جديد
router.route('/register')
    .post(validateRegister, authController.register.bind(authController));

// تسجيل الدخول
router.route('/login')
    .post(validateLogin, authController.login.bind(authController));

// جلب بيانات مستخدم معين (يحتاج إلى توكن JWT)
router.route('/users/:id')
    .get(verifyJWT(), authController.getUser.bind(authController));
module.exports = router;