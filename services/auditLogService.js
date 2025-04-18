const logger = require('../utils/logger');

class AuditLogService {
    constructor() {
        this.initialized = false;
        this.auditLogs = null;
    }

    async init() {
        const db = require('../config/database');
        if (!db.audit_logs) {
            throw new Error('audit_logs model not found in database configuration');
        }
        this.auditLogs = db.audit_logs;
        this.initialized = true;
        logger.info('AuditLogService initialized successfully');
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    async logEvent(userId, action, details = {}) {
        try {
            await this.ensureInitialized();
            const log = await this.auditLogs.create({
                user_id: userId,
                action,
                details: JSON.stringify(details),
                ip_address: details.ipAddress,
                user_agent: details.userAgent
            });
            logger.debug(`Audit log created: ${action} by user ${userId}`);
            return log;
        } catch (error) {
            logger.error(`Error logging audit event: ${error.message}`);
            throw error;
        }
    }

    async getLogsForUser(userId, limit = 100) {
        try {
            await this.ensureInitialized();
            return await this.auditLogs.findAll({
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
