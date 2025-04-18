const { Sequelize } = require('sequelize');
const express = require('express');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const db = require('./config/database');
const logger = require('./utils/logger');
const fs = require('fs');
const http = require('http');
const https = require('https');
const client = require('prom-client');

require('dotenv').config();

// Initialize container first
const container = require('./config/container');

// استراتيجيات المصادقة
require('./strategy/discord-startegy');
require('./strategy/google-strategy')(passport);
require('./strategy/facebook-strategy')(passport);

const app = express();
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// إعداد المقاييس الافتراضية لـ Prometheus
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// مقياس مخصص لقياس مدة الطلبات
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Middleware لحساب مدة الطلبات
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
    });
    next();
});

// نقطة نهاية المقاييس
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// إعدادات الجلسة
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: USE_HTTPS }
}));

// إعدادات التطبيق
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// تهيئة المسارات
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// تحميل المسارات
app.use('/api', router);

// تهيئة Swagger
try {
    const swaggerPath = path.join(__dirname, 'swagger.yaml');
    console.log(`Loading Swagger from: ${swaggerPath}`);

    if (!fs.existsSync(swaggerPath)) {
        throw new Error('swagger.yaml file not found');
    }

    const swaggerDocument = YAML.load(swaggerPath);
    console.log('Swagger document loaded successfully');

    app.use('/api-docs',
        swaggerUi.serve,
        (req, res, next) => {
            console.log('Accessing Swagger UI');
            next();
        },
        swaggerUi.setup(swaggerDocument)
    );
} catch (err) {
    console.error('Swagger setup error:', err);
    app.use('/api-docs', (req, res) => {
        res.status(500).json({ error: 'API documentation unavailable', details: err.message });
    });
}

// إنشاء خادم HTTP/HTTPS
const server = USE_HTTPS
    ? https.createServer({
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    }, app)
    : http.createServer(app);

logger.info(`${USE_HTTPS ? 'HTTPS' : 'HTTP'} mode enabled`);

async function startServer() {
    try {
        // التحقق من اتصال قاعدة البيانات
        await db.sequelize.authenticate();
        logger.info('Database connection established');

        // التحقق من تحميل النماذج
        const requiredModels = ['users', 'audit_logs', 'blogs', 'categories'];
        const missingModels = requiredModels.filter(model => !db[model]);
        
        if (missingModels.length > 0) {
            throw new Error(`Required models not loaded: ${missingModels.join(', ')}`);
        }

        // تهيئة الحاوية
        await container.initialize();
        logger.info('Container initialized successfully');

        // تهيئة خدمة سجل التدقيق
        const auditLogService = require('./services/auditLogService');
        await auditLogService.init();

        // تحميل مسارات المصادقة
        try {
            const authRoutes = require('./routes/auth')(db);
            app.use('/api/auth', authRoutes);
            logger.info('Auth routes loaded successfully');
        } catch (error) {
            logger.warn('Auth routes not loaded:', error.message);
        }

        // تحميل مسارات المستخدمين
        try {
            const userRoutes = require('./routes/users')(db);
            app.use('/api/users', userRoutes);
            logger.info('User routes loaded successfully');
        } catch (error) {
            logger.warn('User routes not loaded:', error.message);
        }

        // تشغيل الخادم
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`API documentation available at http${USE_HTTPS ? 's' : ''}://localhost:${PORT}/api-docs`);
        });
    } catch (err) {
        logger.error(`Server startup failed: ${err.message}`);
        if (err.stack) {
            logger.error(`Stack trace: ${err.stack}`);
        }
        process.exit(1);
    }
}

// معالجة إنهاء التطبيق بشكل آمن
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

startServer();
