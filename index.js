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
const container = require('./container/index');
const models = require('./models');
const sequelize = require('./config/sequelize');

const app = express();
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Prometheus metrics setup
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

// Basic app middleware
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

// Attach container to request object
const containerMiddleware = require('./middlewares/containerMiddleware');
app.use(containerMiddleware);

// Passport strategies
require('./strategy/discord-startegy');
require('./strategy/google-strategy')(passport);
require('./strategy/facebook-strategy')(passport);

// Swagger
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

// App Routes
async function initializeRoutes() {
    await container.initialize();
    logger.info('Container initialized successfully');

    const authRoutes = require('./routes/auth')(container);
    const userRoutes = require('./routes/user/userRoutes')(container);
    const sessionRoutes = require('./routes/auth/sessionRoutes')(container);
    const tokenRoutes = require('./routes/auth/tokenRoutes')(container);
    const passwordRoutes = require('./routes/auth/passwordRoutes')(container);
    const blogRoutes = require('./routes/blog/blogRoutes')(container);

    const router = express.Router();

    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    router.use('/auth', authRoutes);
    router.use('/users', userRoutes);
    router.use('/sessions', sessionRoutes);
    router.use('/auth', tokenRoutes);
    router.use('/auth', passwordRoutes);
    router.use('/blogs', blogRoutes);

    app.use('/api/v1', router);

    // Catch-all for unmatched routes
    app.use('*', (req, res, next) => {
        const { NotFoundError } = require('./errors/CustomErrors');
        next(new NotFoundError('API route not found'));
    });
}

// Start server
let server;

const initServicesModule = require('./container/initServices');
const { initServices } = initServicesModule;
const { initializePermissions } = require('./services/permission/permissionService');
const { initializeRolePermissions } = require('./services/permission/roleService');

async function startServer() {
    try {
        // Initialize other services if needed
        const services = await initServices(models, sequelize);

        // Initialize permissions and roles
        await initializePermissions();
        await initializeRolePermissions();

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

// Graceful shutdown
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

// Test routes for integration testing
if (process.env.NODE_ENV === 'test') {
    const Joi = require('joi');
    const { validateLogin, validate } = require('./validators/validate');
    const { sensitiveLimiter } = require('./middlewares/rateLimiter');
    app.post('/api/v1/auth/login', sensitiveLimiter, validateLogin, (req, res) => res.status(200).json({}));
    app.post('/api/v1/auth/refresh-token', validate(Joi.object({ refresh_token: Joi.string().required() })), (req, res) => res.status(200).json({}));
}

// Launch app
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
module.exports = app;
if (require.main === module) {
    startServer();
}
