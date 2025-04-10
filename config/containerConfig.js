const AuthService = require('../services/authService');
const AuthController = require('../controllers/authController');
const db = require('./databaseConfig');
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
            // Initialize database connection and models
            await db.initialize();
            logger.info('Database initialized successfully');

            // Verify core models are loaded
            if (!db.Users || !db.sessions || !db.AuditLog) {
                throw new Error('Essential database models not loaded');
            }

            // Initialize audit log service first
            const auditLogService = require('../services/auditLogService');
            await auditLogService.ready;

            // Initialize services
            this.services.authService = new AuthService(db, auditLogService);

            // Initialize controllers
            this.controllers.authController = new AuthController(this.services.authService);

            this.isInitialized = true;
            logger.info('Container initialized successfully');
        } catch (error) {
            logger.error('Container initialization failed:', error);
            throw error;
        }
    }

    getService(name) {
        this.verifyInitialized();
        return this.services[name];
    }

    getController(name) {
        this.verifyInitialized();
        return this.controllers[name];
    }

    verifyInitialized() {
        if (!this.isInitialized) {
            throw new Error('Container not initialized. Call initialize() first.');
        }
    }
}

module.exports = new Container();
