const logger = require('../utils/logger');

class AuditLogService {
    constructor() {
        this.initialized = false;
        this.AuditLog = null;
    }

    async init() {
        const db = require('../config/database');
        if (!db.AuditLog) {
            throw new Error('AuditLog model not found in database configuration');
        }
        this.AuditLog = db.AuditLog;
        this.initialized = true;
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    async logEvent(userId, action, details = {}) {
        try {
            await this.ensureInitialized();
            const log = await this.AuditLog.create({
                user_id: userId,
                action,
                details: JSON.stringify(details),
                ip_address: details.ipAddress,
                user_agent: details.userAgent
            });
            return log;
        } catch (error) {
            logger.error(`Error logging audit event: ${error.message}`);
            throw error;
        }
    }

    async getLogsForUser(userId, limit = 100) {
        try {
            await this.ensureInitialized();
            return await this.AuditLog.findAll({
                where: { user_id: userId },
                order: [['created_at', 'DESC']],
                limit
            });
        } catch (error) {
            logger.error(`Error fetching audit logs: ${error.message}`);
            throw error;
        }
    }
}

const auditLogService = new AuditLogService();

// Export promise that resolves when initialized
auditLogService.ready = auditLogService.init().catch(err => {
    logger.error('Failed to initialize AuditLogService:', err);
    throw err; // Re-throw to fail startup
});

// Ensure initialization before any operations
auditLogService.logEvent = async function (...args) {
    await this.ready;
    return this._logEvent(...args);
};

auditLogService.getLogsForUser = async function (...args) {
    await this.ready;
    return this._getLogsForUser(...args);
};

// Keep original implementations
auditLogService._logEvent = auditLogService.logEvent;
auditLogService._getLogsForUser = auditLogService.getLogsForUser;

module.exports = auditLogService;
