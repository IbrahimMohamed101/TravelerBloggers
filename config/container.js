const AuthService = require('../services/authService');
const AuthController = require('../controllers/authController');
const db = require('./database');

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
                console.log('Database connection verified in container');
            } catch (dbError) {
                throw new Error(`Database connection failed: ${dbError.message}`);
            }

            // Verify models are loaded
            if (!db.AuditLog || !db.Users) {
                throw new Error('Database models not properly initialized');
            }

            // Initialize audit log service with error handling
            let auditLogService;
            try {
                auditLogService = require('../services/auditLogService');
                await auditLogService.ready;
                console.log('Audit log service initialized');
            } catch (auditError) {
                throw new Error(`Audit log service initialization failed: ${auditError.message}`);
            }

            // Initialize services with db dependency
            this.services.authService = new AuthService(db, auditLogService);

            // Initialize controllers
            this.controllers.authController = new AuthController(this.services.authService);

            this.isInitialized = true;
        } catch (error) {
            console.error('Container initialization failed:', error);
            throw error;
        }
    }

    getService(name) {
        if (!this.isInitialized) {
            throw new Error('Container not initialized. Call initialize() first.');
        }
        return this.services[name];
    }

    getController(name) {
        if (!this.isInitialized) {
            throw new Error('Container not initialized. Call initialize() first.');
        }
        return this.controllers[name];
    }
}

module.exports = new Container();
