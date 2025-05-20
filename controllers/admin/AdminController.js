const logger = require('../../utils/logger');
const { ValidationError } = require('../../errors/CustomErrors');

class AdminController {
    constructor(container) {
        this.container = container;
        this.adminService = container.getService('adminService');
    }

    /**
     * إنشاء مشرف جديد
     */
    createAdmin = async (req, res) => {
        try {
            const admin = await this.adminService.createAdmin(req.body, req.admin);
            res.status(201).json({
                success: true,
                message: 'تم إنشاء المشرف بنجاح',
                data: admin
            });
        } catch (error) {
            logger.error(`Error in createAdmin controller: ${error.message}`);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * تحديث بيانات مشرف
     */
    updateAdmin = async (req, res) => {
        try {
            const admin = await this.adminService.updateAdmin(
                req.params.adminId,
                req.body,
                req.admin
            );
            res.json({
                success: true,
                message: 'تم تحديث بيانات المشرف بنجاح',
                data: admin
            });
        } catch (error) {
            logger.error(`Error in updateAdmin controller: ${error.message}`);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * حذف مشرف
     */
    deleteAdmin = async (req, res) => {
        try {
            await this.adminService.deleteAdmin(req.params.adminId, req.admin);
            res.json({
                success: true,
                message: 'تم حذف المشرف بنجاح'
            });
        } catch (error) {
            logger.error(`Error in deleteAdmin controller: ${error.message}`);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * الحصول على قائمة المشرفين
     */
    getAdmins = async (req, res) => {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const offset = (page - 1) * limit;

            const result = await this.adminService.getAdmins({
                ...filters,
                offset,
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: result.admins,
                pagination: {
                    total: result.total,
                    page: result.page,
                    total_pages: result.total_pages,
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error(`Error in getAdmins controller: ${error.message}`);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * الحصول على مشرف محدد
     */
    getAdmin = async (req, res) => {
        try {
            const admin = await this.adminService.getAdmin(req.params.adminId);
            res.json({
                success: true,
                data: admin
            });
        } catch (error) {
            logger.error(`Error in getAdmin controller: ${error.message}`);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * تغيير حالة المشرف
     */
    toggleAdminStatus = async (req, res) => {
        try {
            const result = await this.adminService.toggleAdminStatus(
                req.params.adminId,
                req.admin
            );
            res.json({
                success: true,
                message: `تم ${result.is_active ? 'تفعيل' : 'تعطيل'} المشرف بنجاح`,
                data: result
            });
        } catch (error) {
            logger.error(`Error in toggleAdminStatus controller: ${error.message}`);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };

    /**
     * إنشاء المشرف الرئيسي الأول
     */
    createFirstSuperAdmin = async (req, res) => {
        try {
            // التحقق من عدم وجود مشرف رئيسي
            const superAdminExists = await this.adminService.checkSuperAdminExists();
            if (superAdminExists) {
                throw new ValidationError('يوجد مشرف رئيسي بالفعل في النظام');
            }

            const admin = await this.adminService.createFirstSuperAdmin(req.body);
            res.status(201).json({
                success: true,
                message: 'تم إنشاء المشرف الرئيسي بنجاح',
                data: admin
            });
        } catch (error) {
            logger.error(`Error in createFirstSuperAdmin controller: ${error.message}`);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                code: error.code
            });
        }
    };
}

module.exports = AdminController;
