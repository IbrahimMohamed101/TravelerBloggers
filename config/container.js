const AuthService = require('../services/authService');
const AuthController = require('../controllers/authController');
const db = require('./database');
const logger = require('../utils/logger');

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
                await db.sequelize.authenticate();
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

            // Initialize services with db dependency
            this.services.authService = new AuthService(db, auditLogService);
            logger.info('Auth service initialized');

            // Initialize controllers
            this.controllers.authController = new AuthController(this.services.authService);
            logger.info('Auth controller initialized');

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
