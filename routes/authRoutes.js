const express = require('express');
const passport = require('passport');
const router = express.Router()
const container = require('../config/container');
const { validateRegister, validateLogin } = require('../middlewares/validate');
const verifyJWT = require('../middlewares/verifyJWT');
const authController = container.getController('authController');

router.route('/register')
    .post(validateRegister, authController.register.bind(authController));

// تسجيل الدخول
router.route('/login')
    .post(validateLogin, authController.login.bind(authController));

// OAuth2 مع Discord
router.route('/discord')
    .get(passport.authenticate('discord'));

// Callback بعد المصادقة مع Discord
router.route('/discord/redirect')
    .get(passport.authenticate('discord', { failureRedirect: '/login' }), authController.loginWithDiscord.bind(authController));

// OAuth2 مع Google
router.route('/google')
    .get(passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback بعد المصادقة مع Google
router.route('/google/callback')
    .get(passport.authenticate('google', { failureRedirect: '/login' }), authController.loginWithGoogle.bind(authController));

// OAuth2 مع Facebook
router.route('/facebook')
    .get(passport.authenticate('facebook'));

// Callback بعد المصادقة مع Facebook
router.route('/facebook/callback')
    .get(passport.authenticate('facebook', { failureRedirect: '/login' }), authController.loginWithFacebook.bind(authController));


// جلب بيانات مستخدم معين (يحتاج إلى توكن JWT)
router.route('/users/:id')
    .get(verifyJWT(), authController.getUser.bind(authController));
module.exports = router;
