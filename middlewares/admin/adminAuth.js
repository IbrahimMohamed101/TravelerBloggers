// middlewares/admin/adminAuth.js
const logger = require('../../utils/logger');
const { UnauthorizedError, ForbiddenError } = require('../../errors/CustomErrors');

class AdminAuthMiddleware {
    constructor(container) {
        this.container = container;
        this.roleService = container.getService('roleService');
        this.permissionService = container.getService('permissionService');
    }

    /**
     * التحقق من أن المستخدم مشرف
     */
    requireAdmin = async (req, res, next) => {
        try {
            if (!req.user || !req.user.userId) {
                throw new UnauthorizedError('يجب تسجيل الدخول أولاً');
            }

            const user = await this.container.getDb().users.findByPk(req.user.userId, {
                include: [{
                    model: this.container.getDb().role,
                    attributes: ['name', 'description']
                }]
            });

            if (!user || !user.is_active) {
                throw new ForbiddenError('الحساب غير مفعل');
            }

            // التحقق من أن المستخدم لديه دور مشرف
            if (!user.role || !['super_admin', 'admin'].includes(user.role.name)) {
                throw new ForbiddenError('غير مصرح لك بالوصول إلى هذه الصفحة');
            }

            // إضافة معلومات المستخدم للطلب
            req.admin = {
                id: user.id,
                role: user.role.name,
                permissions: await this.roleService.getRolePermissions(user.role.name)
            };

            next();
        } catch (error) {
            logger.error(`Admin auth error: ${error.message}`);
            res.status(error.statusCode || 403).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * التحقق من أن المستخدم مشرف رئيسي
     */
    requireSuperAdmin = async (req, res, next) => {
        try {
            if (!req.user || !req.user.userId) {
                throw new UnauthorizedError('يجب تسجيل الدخول أولاً');
            }

            const user = await this.container.getDb().users.findByPk(req.user.userId, {
                include: [{
                    model: this.container.getDb().role,
                    attributes: ['name', 'description']
                }]
            });

            if (!user || !user.is_active) {
                throw new ForbiddenError('الحساب غير مفعل');
            }

            // التحقق من أن المستخدم لديه دور مشرف رئيسي
            if (!user.role || user.role.name !== 'super_admin') {
                throw new ForbiddenError('يجب أن تكون مشرفاً رئيسياً للوصول إلى هذه الصفحة');
            }

            // إضافة معلومات المستخدم للطلب
            req.admin = {
                id: user.id,
                role: user.role.name,
                permissions: await this.roleService.getRolePermissions(user.role.name)
            };

            next();
        } catch (error) {
            logger.error(`Super admin auth error: ${error.message}`);
            res.status(error.statusCode || 403).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * التحقق من صلاحية محددة
     * @param {string} requiredPermission - الصلاحية المطلوبة
     */
    requirePermission = (requiredPermission) => {
        return async (req, res, next) => {
            try {
                // التحقق من وجود معلومات المشرف
                if (!req.admin) {
                    await this.requireAdmin(req, res, () => {});
                }

                // المشرف الرئيسي لديه جميع الصلاحيات
                if (req.admin.role === 'super_admin') {
                    return next();
                }

                // التحقق من الصلاحية المطلوبة
                const hasPermission = req.admin.permissions.some(
                    permission => permission.name === requiredPermission
                );

                if (!hasPermission) {
                    throw new ForbiddenError('ليس لديك الصلاحية المطلوبة للقيام بهذه العملية');
                }

                next();
            } catch (error) {
                logger.error(`Permission check error: ${error.message}`);
                res.status(error.statusCode || 403).json({
                    success: false,
                    message: error.message,
                    code: error.code
                });
            }
        };
    };

    /**
     * التحقق من مجموعة من الصلاحيات
     * @param {string[]} requiredPermissions - الصلاحيات المطلوبة
     * @param {boolean} requireAll - هل يجب توفر جميع الصلاحيات
     */
    requirePermissions = (requiredPermissions, requireAll = true) => {
        return async (req, res, next) => {
            try {
                // التحقق من وجود معلومات المشرف
                if (!req.admin) {
                    await this.requireAdmin(req, res, () => {});
                }

                // المشرف الرئيسي لديه جميع الصلاحيات
                if (req.admin.role === 'super_admin') {
                    return next();
                }

                // التحقق من الصلاحيات المطلوبة
                const hasPermissions = requireAll
                    ? requiredPermissions.every(permission =>
                        req.admin.permissions.some(p => p.name === permission)
                    )
                    : requiredPermissions.some(permission =>
                        req.admin.permissions.some(p => p.name === permission)
                    );

                if (!hasPermissions) {
                    throw new ForbiddenError(
                        requireAll
                            ? 'يجب أن تمتلك جميع الصلاحيات المطلوبة'
                            : 'يجب أن تمتلك واحدة من الصلاحيات المطلوبة على الأقل'
                    );
                }

                next();
            } catch (error) {
                logger.error(`Permissions check error: ${error.message}`);
                res.status(error.statusCode || 403).json({
                    success: false,
                    message: error.message,
                    code: error.code
                });
            }
        };
    };
}

module.exports = AdminAuthMiddleware;