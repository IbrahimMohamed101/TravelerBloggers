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
            // Wait for database connection and sync
            await db.sequelize.authenticate();
            await db.sequelize.sync({ force: false });

            // Verify models are loaded
            if (!db.AuditLog || !db.Users) {
                throw new Error('Database models not properly initialized');
            }

            // Initialize audit log service first
            const auditLogService = require('../services/auditLogService');
            await auditLogService.ready;

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
