   // إنشاء ملف scripts/createFirstSuperAdmin.js
   const bcrypt = require('bcrypt');
   const models = require('../models');
   const logger = require('../utils/logger');

   async function createFirstSuperAdmin() {
       try {
           // 1. الحصول على دور super_admin
           const superAdminRole = await models.role.findOne({
               where: { name: 'super_admin' }
           });

           if (!superAdminRole) {
               throw new Error('Super admin role not found');
           }

           // 2. إنشاء المستخدم الأول
           const hashedPassword = await bcrypt.hash('YourSecurePassword123!', 10);
           
           const superAdmin = await models.users.create({
               first_name: 'Super',
               last_name: 'Admin',
               username: 'superadmin',
               email: 'admin@example.com',
               password: hashedPassword,
               role_id: superAdminRole.id,
               email_verified: true,
               is_active: true
           });

           logger.info('First super admin created successfully');
           return superAdmin;
       } catch (error) {
           logger.error('Failed to create first super admin:', error);
           throw error;
       }
   }

   module.exports = createFirstSuperAdmin;