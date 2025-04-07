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
const fs = require('fs');
const http = require('http');
const https = require('https');

require('dotenv').config();

// استراتيجيات المصادقة
require('./strategy/discord-startegy');
require('./strategy/google-strategy')(passport);
require('./strategy/facebook-strategy')(passport);

const app = express();
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// إعدادات الجلسة
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: USE_HTTPS }
}));

// الإعدادات الأساسية
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

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

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// Health check endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        database: db.sequelize.authenticate() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/users', authRoutes);

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

// تهيئة Sequelize وتشغيل الخادوم
db.sequelize
    .sync({ force: false })
    .then(() => {
        logger.info('Database synced successfully');
        server.listen(PORT, () => {
            logger.info(`${USE_HTTPS ? 'HTTPS' : 'HTTP'} Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error(`Error syncing database: ${err.message}`);
    });
