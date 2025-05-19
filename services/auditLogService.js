const logger = require('../utils/logger');
const sequelize = require('../config/sequelize');
const initModels = require('../models/init-models');
const { InternalServerError } = require('../errors/CustomErrors');

const db = initModels(sequelize);

class AuditLogService {
    constructor() {
        this.initialized = false;
        this.auditLogs = null;
    }

    async init() {
        if (!db.audit_logs) {
            throw new InternalServerError('audit_logs model not found in database configuration');
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

    async logEvent({ userId, action, status, details = {}, ipAddress, userAgent, path }) {
        try {
            await this.ensureInitialized();
            
            // Skip DB logging if userId is null (DB constraint requires non-null user_id)
            if (userId === null || userId === undefined) {
                logger.debug(`Skipped audit log for anonymous access: ${action} - ${status}`);
                return null;
            }
            
            const currentTime = new Date();
            const log = await this.auditLogs.create({
                user_id: userId,
                action,
                status,
                details: JSON.stringify(details),
                ip_address: ipAddress,
                user_agent: userAgent,
                path,
                created_at: currentTime,
                updated_at: currentTime
            });
            logger.debug(`Audit log created: ${action} by user ${userId} - ${status}`);
            return log;
        } catch (error) {
            logger.error(`Error logging audit event: ${error.message}`);
            throw error;
        }
    }

    async getLogsForUser(userId, { limit = 100, offset = 0, action, status }) {
        try {
            await this.ensureInitialized();
            const where = { user_id: userId };
            if (action) where.action = action;
            if (status) where.status = status;

            return await this.auditLogs.findAll({
                where,
                order: [['created_at', 'DESC']],
                limit,
                offset
            });
        } catch (error) {
            logger.error(`Error fetching audit logs: ${error.message}`);
            throw error;
        }
    }

    async getLogs({ limit = 100, offset = 0, userId, action, status }) {
        try {
            await this.ensureInitialized();
            const where = {};
            if (userId) where.user_id = userId;
            if (action) where.action = action;
            if (status) where.status = status;

            return await this.auditLogs.findAll({
                where,
                order: [['created_at', 'DESC']],
                limit,
                offset
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
    throw err;
});

// Keep original implementations first
auditLogService._logEvent = auditLogService.logEvent;
auditLogService._getLogsForUser = auditLogService.getLogsForUser;
auditLogService._getLogs = auditLogService.getLogs;

// Ensure initialization before any operations
auditLogService.logEvent = async function (...args) {
    await this.ready;
    return this._logEvent.apply(this, args);
};

auditLogService.getLogsForUser = async function (...args) {
    await this.ready;
    return this._getLogsForUser.apply(this, args);
};

auditLogService.getLogs = async function (...args) {
    await this.ready;
    return this._getLogs.apply(this, args);
};

module.exports = auditLogService;