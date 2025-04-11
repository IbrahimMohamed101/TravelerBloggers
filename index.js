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

// Swagger with error handling
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

// Health check endpoint
app.get('/status', async (req, res) => {
    try {
        await db.sequelize.authenticate();
        res.json({
            status: 'running',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'running',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Routes (must be required after container initialization)
const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/users', authRoutes);

// Discord Auth
app.get("/api/auth/discord", passport.authenticate("discord"));
app.get("/api/auth/discord/redirect", passport.authenticate("discord"), (req, res) => {
    res.sendStatus(200);
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.stack}`);
    res.status(500).json({ message: 'Something went wrong!' });
});

// تحديد نوع السيرفر (HTTP/HTTPS)
let server;

if (USE_HTTPS) {
    const credentials = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || 'key.pem', 'utf8'),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || 'cert.pem', 'utf8')
    };
    server = https.createServer(credentials, app);
    logger.info('HTTPS mode enabled');
} else {
    server = http.createServer(app);
    logger.info('HTTP mode enabled');
}

async function startServer() {
    try {
        // Verify database connection first
        await db.sequelize.authenticate();
        logger.info('Database connection established');

        // Ensure models are loaded
        if (!db.Users || !db.AuditLog) {
            throw new Error('Database models not properly loaded');
        }

        // Sync database with error handling
        try {
            await db.sequelize.sync({ force: false });
            logger.info('Database synced successfully');
        } catch (syncError) {
            logger.error('Database sync error:', syncError);
            throw syncError;
        }

        // Initialize container with additional checks
        try {
            await container.initialize();
            logger.info('Container initialized successfully');
        } catch (containerError) {
            logger.error('Container initialization error:', containerError);
            throw containerError;
        }

        // Initialize audit log service
        const auditLogService = require('./services/auditLogService');
        await auditLogService.init();

        // Start server
        server.listen(PORT, () => {
            logger.info(`${USE_HTTPS ? 'HTTPS' : 'HTTP'} Server running on port ${PORT}`);
        });
    } catch (err) {
        logger.error(`Server startup failed: ${err.message}`);
        process.exit(1);
    }
}

startServer();
