require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const errorHandler = require('./middlewares/errorHandler');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const client = require('prom-client');

const logger = require('./utils/logger');
const container = require('./config/container');

const app = express();
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// 🟡 Prometheus metrics setup
client.collectDefaultMetrics({ timeout: 5000 });

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 1, 3, 5]
});

app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
    });
    next();
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// 🟡 Basic app middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: USE_HTTPS }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 🟡 Passport strategies
require('./strategy/discord-startegy');
require('./strategy/google-strategy')(passport);
require('./strategy/facebook-strategy')(passport);

// 🟡 Swagger
function initializeSwagger() {
    try {
        const swaggerPath = path.join(__dirname, 'swagger.yaml');
        if (fs.existsSync(swaggerPath)) {
            const swaggerDocument = YAML.load(swaggerPath);
            app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            logger.info('Swagger documentation initialized');
        } else {
            logger.warn('Swagger documentation file not found');
        }
    } catch (error) {
        logger.error('Swagger init failed:', error);
    }
}

// 🟡 App Routes
async function initializeRoutes() {
    await container.initialize();
    logger.info('Container initialized successfully');

    const authRoutes = require('./routes/authRoutes')(container);
    const userRoutes = require('./routes/userRoutes')(container);
    const sessionRoutes = require('./routes/sessionRoutes')(container);

    const router = express.Router();

    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    router.use('/auth', authRoutes);
    router.use('/users', userRoutes);
    router.use('/sessions', sessionRoutes);

    app.use('/api/v1', router);
}

// 🟡 Start server
let server;

async function startServer() {
    try {
        await initializeRoutes();
        initializeSwagger();
        app.use(errorHandler);

        if (USE_HTTPS) {
            const privateKey = fs.readFileSync('ssl/private.key', 'utf8');
            const certificate = fs.readFileSync('ssl/certificate.crt', 'utf8');
            const credentials = { key: privateKey, cert: certificate };
            server = https.createServer(credentials, app);
        } else {
            server = http.createServer(app);
        }

        server.listen(PORT, () => {
            logger.info(`✅ Server running on ${USE_HTTPS ? 'https' : 'http'}://localhost:${PORT}`);
        });

        server.on('error', error => {
            logger.error('Server error:', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Startup error:', error);
        process.exit(1);
    }
}

// 🟡 Graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
        logger.info(`${signal} signal received`);
        server?.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    });
});

process.on('uncaughtException', error => {
    logger.error('Uncaught exception:', error);
    server?.close(() => process.exit(1));
});

// Error handling middleware


// 🟢 Launch app
startServer();
