const RedisService = require('../services/cache/redisService');
const TokenService = require('../services/auth/tokenService');
const SessionService = require('../services/auth/sessionService');
const OAuthService = require('../services/auth/oauthService');
const AuthService = require('../services/auth/authService');
const UserService = require('../services/user/userService');
const PasswordService = require('../services/auth/PasswordService');
const emailService = require('../services/email/emailService');
const logger = require('../utils/logger');
const { enableAuditLog, useRedis } = require('./containerConfig');

const { initializePermissions } = require('../services/permission/permissionService');
const { initializeRolePermissions } = require('../services/permission/roleService');

async function initServices(db, sequelize) {
    const services = {};

    if (useRedis) {
        try {
            services.redisService = new RedisService();
            logger.info('Redis service initialized');
        } catch (err) {
            logger.warn('Redis init failed:', err);
            services.redisService = null;
        }
    }

    if (enableAuditLog) {
        try {
            const auditLogService = require('../services/auditLogService');
            await auditLogService.ready;
            services.auditLogService = auditLogService;
            logger.info('Audit log service initialized');
        } catch (err) {
            throw new Error(`Audit log init failed: ${err.message}`);
        }
    }

    services.tokenService = new TokenService(services.redisService, db);
    services.sessionService = new SessionService(services.redisService, services.tokenService);
    services.oauthService = new OAuthService();

    // Add role model to db for AuthService usage
    if (!db.role) {
        db.role = require('../models/role')(sequelize, sequelize.Sequelize.DataTypes);
    }

    services.authService = new AuthService(
        db, services.redisService, services.tokenService,
        services.sessionService, services.oauthService, emailService, sequelize
    );

    services.userService = new UserService(db, services.redisService, services.tokenService);
    services.passwordService = new PasswordService(db, services.redisService, services.tokenService, sequelize);

    return services;
}

async function initializePermissionServices() {
    await initializePermissions();
    await initializeRolePermissions();
}

module.exports = { initServices, initializePermissionServices };
