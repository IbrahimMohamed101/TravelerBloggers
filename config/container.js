const { AuthService, OAuthService, SessionService } = require('../services/auth');
const TokenService = require('../services/security/tokenService');
const RedisService = require('../services/cache/redisService');
const UserService = require('../services/user/userService');
const AuthController = require('../controllers/auth/authController');
const OAuthController = require('../controllers/auth/oauthController');
const SessionController = require('../controllers/auth/sessionController');
const UserController = require('../controllers/user/userController');
const emailService = require('../services/email/emailService');
const sequelize = require('./sequelize');
const initModels = require('../models/init-models');
const logger = require('../utils/logger');

const db = initModels(sequelize);

class Container {
    constructor() {
        this.services = {};
        this.controllers = {};
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Verify database connection
            try {
                await sequelize.authenticate();
                logger.info('Database connection verified in container');
            } catch (dbError) {
                throw new Error(`Database connection failed: ${dbError.message}`);
            }

            // Verify required models are loaded
            const requiredModels = ['users', 'audit_logs', 'blogs', 'categories'];
            const missingModels = requiredModels.filter(model => !db[model]);

            if (missingModels.length > 0) {
                throw new Error(`Required models not loaded: ${missingModels.join(', ')}`);
            }

            logger.info('All required models verified');

            // Initialize audit log service with error handling
            let auditLogService;
            try {
                auditLogService = require('../services/auditLogService');
                await auditLogService.ready;
                logger.info('Audit log service initialized');
            } catch (auditError) {
                throw new Error(`Audit log service initialization failed: ${auditError.message}`);
            }

            // Initialize Redis service without calling connect()
            try {
                this.services.redisService = new RedisService();
                logger.info('Redis service initialized');
            } catch (redisError) {
                logger.warn(`Redis service initialization failed: ${redisError.message}`);
                this.services.redisService = null;
            }

            // Initialize token service
            this.services.tokenService = new TokenService(this.services.redisService);
            logger.info('Token service initialized');

            // Initialize session service
            this.services.sessionService = new SessionService(
                this.services.redisService,
                this.services.tokenService
            );
            logger.info('Session service initialized');

            // Initialize OAuth service
            this.services.oauthService = new OAuthService();
            logger.info('OAuth service initialized');

            // Initialize auth service with all dependencies
            this.services.authService = new AuthService(
                db,
                this.services.redisService,
                this.services.tokenService,
                this.services.sessionService,
                this.services.oauthService,
                emailService,
                sequelize
            );
            logger.info('Auth service initialized');

            // Initialize user service
            this.services.userService = new UserService(
                db,
                this.services.redisService,
                this.services.tokenService
            );
            logger.info('User service initialized');

            // Initialize controllers
            this.controllers.authController = new AuthController(
                this.services.authService,
                this.services.sessionService,
                this.services.tokenService
            );
            logger.info('Auth controller initialized');

            this.controllers.oauthController = new OAuthController(
                this.services.authService
            );
            logger.info('OAuth controller initialized');

            this.controllers.sessionController = new SessionController(
                this.services.sessionService
            );
            logger.info('Session controller initialized');

            this.controllers.userController = new UserController(
                this.services.userService
            );
            logger.info('User controller initialized');

            this.isInitialized = true;
            logger.info('Container initialization completed successfully');
        } catch (error) {
            logger.error('Container initialization failed:', error);
            throw error;
        }
    }

    getService(name) {
        if (!this.isInitialized) {
            throw new Error('Container not initialized. Call initialize() first.');
        }
        const service = this.services[name];
        if (!service) {
            throw new Error(`Service '${name}' not found in container`);
        }
        return service;
    }

    getController(name) {
        if (!this.isInitialized) {
            throw new Error('Container not initialized. Call initialize() first.');
        }
        const controller = this.controllers[name];
        if (!controller) {
            throw new Error(`Controller '${name}' not found in container`);
        }
        return controller;
    }
}

module.exports = new Container();
