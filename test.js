const { Sequelize } = require('sequelize');
const express = require('express');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const logger = require('./utils/logger');
const https = require('https'); // استيراد مكتبة https
const fs = require('fs'); // لقراءة ملفات الشهادة
require('dotenv').config();

// استيراد استراتيجيات المصادقة
require('./strategy/discord-startegy');
require('./strategy/google-strategy')(passport);
require('./strategy/facebook-strategy')(passport);

// إنشاء تطبيق Express
const app = express();

// إعداد تحليل JSON
app.use(express.json());

// إعداد الجلسة (Session)
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your_secret_key', // استخدام متغير بيئة للسر
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }, // يجب أن يكون true عند استخدام HTTPS
    })
);

// تهيئة Passport
app.use(passport.initialize());
app.use(passport.session());

// إعداد Swagger لتوثيق API
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// إعداد Rate Limiting لحماية التطبيق من الهجمات
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // الحد الأقصى للطلبات
});
app.use(limiter);

// إعداد المسارات
app.use('/users', authRoutes);

// مسار تسجيل الدخول عبر Discord
app.get('/api/auth/discord', passport.authenticate('discord'));
app.get(
    '/api/auth/discord/redirect',
    passport.authenticate('discord', {
        successRedirect: '/', // إعادة توجيه عند النجاح
        failureRedirect: '/login', // إعادة توجيه عند الفشل
        failureFlash: true,
    }),
    (req, res) => {
        res.sendStatus(200);
    }
);

// مسار تسجيل الدخول عبر Google
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
    }),
    (req, res) => {
        res.sendStatus(200);
    }
);

// مسار تسجيل الدخول عبر Facebook
app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get(
    '/api/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
    }),
    (req, res) => {
        if (req.session.messages) {
            logger.error('Facebook Login Error:', req.session.messages);
        }
        res.sendStatus(200);
    }
);

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.stack}`);
    res.status(500).json({ message: 'Something went wrong!' });
});

// قراءة الشهادة والمفتاح لتشغيل HTTPS
const privateKey = fs.readFileSync('certs/key.pem', 'utf8');
const certificate = fs.readFileSync('certs/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// إنشاء خادوم HTTPS
const httpsServer = https.createServer(credentials, app);

// تهيئة Sequelize وتشغيل الخادوم
db.sequelize
    .sync({ force: false })
    .then(() => {
        logger.info('Database synced successfully');
        const PORT = process.env.PORT || 3000;
        httpsServer.listen(PORT, () => {
            logger.info(`HTTPS Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error(`Error syncing database: ${err.message}`);
    });