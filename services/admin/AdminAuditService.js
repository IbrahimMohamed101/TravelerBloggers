// services/admin/AdminAuditService.js
class AdminAuditService {
    constructor(db) {
        this.db = db;
        this.AdminLog = db.AdminLog;
    }

    async logAction(adminId, action, details) {
        await this.AdminLog.create({
            admin_id: adminId,
            action,
            details,
            ip_address: details.ip,
            user_agent: details.userAgent
        });
    }

    async getAuditLogs(filters) {
        return this.AdminLog.findAll({
            where: filters,
            include: [{
                model: this.db.users,
                attributes: ['username', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });
    }
}