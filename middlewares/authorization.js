const logger = require('../utils/logger');
const db = require('../config/database');

module.exports = (requiredRole) => {
    return async (req, res, next) => {
        try {
            // 1. التحقق من وجود مستخدم مسجل الدخول
            if (!req.user) {
                logger.warn('محاولة وصول غير مصرح بها - لا يوجد مستخدم مسجل');
                return res.status(401).json({
                    message: 'غير مصرح بالدخول',
                    code: 'UNAUTHORIZED'
                });
            }

            // 2. تسجيل معلومات المستخدم
            const user = await db.users.findByPk(req.user.id);
            if (!user || !user.is_active) {
                logger.warn(`محاولة وصول لحساب غير مفعل: ${req.user.id}`);
                return res.status(403).json({
                    message: 'الحساب غير مفعل',
                    code: 'ACCOUNT_INACTIVE'
                });
            }

            // 3. هرمية الصلاحيات
            const roleHierarchy = {
                'super_admin': 4,
                'admin': 3,
                'content_manager': 2,
                'user': 1
            };

            // 4. التحقق من الصلاحية
            if (roleHierarchy[user.role] >= roleHierarchy[requiredRole]) {
                logger.info(`تم التحقق من الصلاحية بنجاح للمستخدم ${user.id} للوصول إلى ${req.path}`);
                return next();
            }

            // 5. تسجيل محاولة الوصول المرفوضة
            logger.warn(`محاولة وصول مرفوضة للمستخدم ${user.id} (${user.role}) إلى مسار يتطلب صلاحية ${requiredRole}`);
            return res.status(403).json({
                message: 'غير مسموح بالوصول - صلاحيات غير كافية',
                code: 'FORBIDDEN',
                requiredRole,
                userRole: user.role
            });

        } catch (error) {
            logger.error(`خطأ في نظام الصلاحيات: ${error.message}`);
            return res.status(500).json({
                message: 'خطأ داخلي في الخادم',
                code: 'SERVER_ERROR'
            });
        }
    };
};
