const RedisService = require('../services/cache/redisService');
const TokenService = require('../services/auth/tokenService');
const SessionService = require('../services/auth/sessionService');
const OAuthService = require('../services/auth/oauthService');
const AuthService = require('../services/auth/authService');
const UserService = require('../services/user/userService');
const PasswordService = require('../services/auth/PasswordService');
const EmailService = require('../services/email/emailService');
const EmailVerificationService = require('../services/auth/emailVerificationService');
const BlogService = require('../services/blog/BlogService');
const CategoryService = require('../services/blog/CategoryService');
const TagService = require('../services/blog/TagService');
const InteractionService = require('../services/blog/InteractionService');
const RoleService = require('../services/permission/roleService');
const PermissionService = require('../services/permission/permissionService');
const logger = require('../utils/logger');
const { enableAuditLog, useRedis } = require('./containerConfig');

async function initServices(db, sequelize, container) {
    const services = {};

    if (useRedis) {
        try {
            services.redisService = new RedisService();
            await services.redisService.initialize();
            logger.info('Redis service initialized');
        } catch (err) {
            logger.warn('Redis init failed:', err);
            services.redisService = { enabled: false };
        }
    } else {
        services.redisService = { enabled: false };
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

    services.authService = new AuthService(
        db,
        services.redisService,
        services.tokenService,
        services.sessionService,
        services.oauthService,
        EmailService,
        sequelize
    );

    services.emailVerificationService = new EmailVerificationService(
        db,
        services.tokenService,
        sequelize,
        EmailService
    );

    services.userService = new UserService(db, services.redisService, services.tokenService);
    services.passwordService = new PasswordService(db, services.redisService, services.tokenService, sequelize);

    // Initialize blog services
    services.blogService = new BlogService(db, services.redisService);
    services.categoryService = new CategoryService(db, services.redisService);
    services.tagService = new TagService(db, services.redisService);
    services.interactionService = new InteractionService(db, services.redisService);

    // Initialize permission services
    services.roleService = new RoleService(db, services.redisService);
    services.permissionService = new PermissionService(db, services.redisService);

    // Set audit service for role service if available
    if (services.auditLogService) {
        services.roleService.setAuditService(services.auditLogService);
    }

    // Initialize permissions and roles
    try {
        await services.permissionService.initializePermissions();
        await services.roleService.initializeRolePermissions();
        logger.info('Permissions and roles initialized');
    } catch (err) {
        logger.error('Failed to initialize permissions and roles:', err);
        throw err;
    }

    return services;
}

module.exports = { initServices };