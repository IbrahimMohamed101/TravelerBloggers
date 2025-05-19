const logger = require('../utils/logger');
const { UnauthorizedError, ForbiddenError, InternalServerError } = require('../errors/CustomErrors');
const { getRolePermissions } = require('../services/permission/roleService');

module.exports = (options = {}) => {
    const { requiredPermission, ownershipCheck, allowSuperAdmin = true } = options;

    return async (req, res, next) => {
        try {
            // 1. Check if the user is logged in
            if (!req.user || !req.user.userId) {
                // Don't try to log with null userId as it violates DB constraints
                logger.warn(`Unauthorized access attempt to ${req.path}`, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                throw new UnauthorizedError('Unauthorized access', 'UNAUTHORIZED');
            }

            const userId = req.user.userId;
            const redisService = req.container.getService('redisService');

            // 2. Load user data from Redis or Database
            let user;
            if (redisService.enabled) {
                const cachedUser = await redisService.get(`user:${userId}`);
                if (cachedUser) {
                    user = JSON.parse(cachedUser);
                }
            }

            if (!user) {
                const db = req.container.getDb();
                if (!db) {
                    logger.error('Database object missing in request container.', {
                        path: req.path,
                        userId
                    });
                    throw new InternalServerError('Internal server error');
                }
                if (!db.users) {
                    logger.error('db.users model missing in request container.', {
                        path: req.path,
                        userId
                    });
                    throw new InternalServerError('Internal server error');
                }
                // Try fallback: use 'role' if 'roles' is missing but 'role' exists
                if (!db.role && db.role) {
                    // Only assign once without logging repeatedly
                    if (!db._rolesFallbackUsed) {
                        logger.warn("db.roles not found, using db.role instead.", {
                            path: req.path,
                            userId,
                            dbKeys: Object.keys(db)
                        });
                        db._rolesFallbackUsed = true;
                    }
                    db.role = db.role;
                }
                if (!db.role) {
                    logger.error('db.role model missing in request container.', {
                        path: req.path,
                        userId,
                        dbKeys: Object.keys(db),
                        hint: "Did you mean 'role' instead of 'roles'? Available keys: " + Object.keys(db).join(', ')
                    });
                    throw new InternalServerError('Internal server error');
                }
                user = await db.users.findByPk(userId, {
                    attributes: ['id', 'role_id', 'is_active']
                });

                if (!user || !user.is_active) {
                    await req.container.getService('auditLogService').logEvent({
                        userId,
                        action: `access_${req.path}`,
                        status: 'failed',
                        details: { reason: 'Account inactive or not found' },
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        path: req.path
                    });
                    throw new ForbiddenError('Account is inactive or not found', 'ACCOUNT_INACTIVE');
                }

                if (redisService.enabled) {
                    await redisService.set(`user:${userId}`, JSON.stringify(user), 3600);
                }
            }

            // 3. Check user permissions
            let hasPermission = false;

            // Get the role name from the role_id
            const db = req.container.getDb();
            // Try fallback: use 'role' if 'roles' is missing but 'role' exists
            if (!db.role && db.role) {
                logger.warn("db.roles not found, using db.role instead.", {
                    path: req.path,
                    userId,
                    dbKeys: Object.keys(db)
                });
                db.role = db.role;
            }
            if (!db.role) {
                logger.error('db.role model missing in request container (roles lookup).', {
                    path: req.path,
                    userId,
                    dbKeys: Object.keys(db),
                    hint: "Did you mean 'role' instead of 'roles'? Available keys: " + Object.keys(db).join(', ')
                });
                throw new InternalServerError('Internal server error');
            }
            const userRole = await db.role.findByPk(user.role_id, {
                attributes: ['name']
            });
            const roleName = userRole ? userRole.name : 'user';

            if (allowSuperAdmin && roleName === 'super_admin') {
                hasPermission = true;
            } else if (requiredPermission) {
                const userPermissions = await getRolePermissions(roleName, redisService);
                hasPermission = userPermissions.includes(requiredPermission);
            }

            // 4. If no permission, check if the user is the owner
            let isOwner = false;
            if (!hasPermission && ownershipCheck) {
                isOwner = await ownershipCheck(req, userId);
                hasPermission = isOwner;
            }

            if (hasPermission) {
                await req.container.getService('auditLogService').logEvent({
                    userId,
                    action: `access_${req.path}`,
                    status: 'success',
                    details: {
                        permission: requiredPermission,
                        role: roleName,
                        isOwner
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path
                });

                logger.info(`Permission granted for user ${userId} to access ${req.path}`, {
                    role: roleName,
                    permission: requiredPermission,
                    isOwner
                });

                req.user.role = roleName;
                return next();
            }

            // Log denied access attempt
            await req.container.getService('auditLogService').logEvent({
                userId,
                action: `access_${req.path}`,
                status: 'failed',
                details: {
                    permission: requiredPermission,
                    role: roleName,
                    isOwner,
                    reason: 'Insufficient permissions or not owner'
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });

            logger.warn(`Access denied for user ${userId} (${roleName}) to path requiring ${requiredPermission}`, {
                ip: req.ip,
                path: req.path
            });

            throw new ForbiddenError(
                'Access denied - insufficient permissions or not the content owner',
                'FORBIDDEN',
                { requiredPermission, userRole: roleName }
            );

        } catch (error) {
            logger.error(`Authorization system error: ${error.message}`, {
                stack: error.stack,
                userId: req.user?.userId,
                path: req.path
            });

            if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
                const response = {
                    message: error.message,
                    statusCode: error.statusCode
                };

                // Add code if it exists
                if (error.code) {
                    response.code = error.code;
                }

                // Add details if they exist
                if (error.details) {
                    response.details = error.details;
                }

                return res.status(error.statusCode).json(response);
            }

            throw new InternalServerError('Internal server error');
        }
    };
};