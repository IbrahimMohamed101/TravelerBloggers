/**
 * تنفيذ أوامر SQL مباشرة على قاعدة البيانات باستخدام Sequelize
 */
const sequelize = require('./config/sequelize');
const fs = require('fs');
const path = require('path');

async function executeSQL() {
    try {
        // قراءة ملف SQL
        const sqlFile = path.join(__dirname, 'fix_role_permissions.sql');
        let sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('جاري الاتصال بقاعدة البيانات...');
        await sequelize.authenticate();
        console.log('✓ تم الاتصال بقاعدة البيانات بنجاح');
        
        // تقسيم الملف إلى استعلامات منفصلة
        const queries = sqlContent.split(';').filter(query => query.trim() !== '');
        
        // تنفيذ كل استعلام
        console.log(`تنفيذ ${queries.length} من الاستعلامات...`);
        
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i].trim() + ';';
            
            try {
                // طباعة معلومات موجزة عن الاستعلام
                const queryPreview = query.length > 50 
                    ? query.substring(0, 50) + '...' 
                    : query;
                console.log(`[${i+1}/${queries.length}] تنفيذ: ${queryPreview}`);
                
                // تنفيذ الاستعلام
                await sequelize.query(query);
                console.log(`✓ تم تنفيذ الاستعلام ${i+1} بنجاح`);
            } catch (err) {
                console.error(`✗ خطأ في تنفيذ الاستعلام ${i+1}:`, err.message);
                
                // إذا كان الخطأ يتعلق بجدول غير موجود، يمكن تجاهله
                if (err.message.includes('does not exist') && query.toLowerCase().includes('drop table')) {
                    console.log('  (هذا الخطأ متوقع ويمكن تجاهله)');
                    continue;
                }
                
                // إذا كان الخطأ يتعلق بسجل موجود بالفعل، يمكن تجاهله
                if (err.message.includes('duplicate key') || err.message.includes('already exists')) {
                    console.log('  (هذا الخطأ متوقع ويمكن تجاهله)');
                    continue;
                }
                
                // غير ذلك، توقف التنفيذ
                if (!process.env.FORCE_CONTINUE) {
                    console.error('توقف التنفيذ بسبب خطأ. اضبط FORCE_CONTINUE=1 للاستمرار رغم الأخطاء.');
                    process.exit(1);
                }
            }
        }
        
        console.log('✓ تم تنفيذ جميع الاستعلامات بنجاح');
        
        // تأكيد أن الجدول تم إنشاؤه بشكل صحيح
        try {
            const tableInfo = await sequelize.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'role_permissions' AND table_schema = 'public'",
                { type: sequelize.QueryTypes.SELECT }
            );
            
            console.log('\nهيكل جدول role_permissions الحالي:');
            tableInfo.forEach(column => {
                console.log(`- ${column.column_name}: ${column.data_type}`);
            });
            
            // التأكد من وجود عمود role_id وليس role
            const hasRoleId = tableInfo.some(column => column.column_name === 'role_id');
            const hasRole = tableInfo.some(column => column.column_name === 'role');
            
            if (hasRoleId && !hasRole) {
                console.log('\n✓ تم التأكد من تحديث الجدول بشكل صحيح (يحتوي على role_id وليس role)');
            } else if (hasRole) {
                console.error('\n✗ الجدول لا يزال يحتوي على عمود role بدلاً من role_id!');
            } else {
                console.error('\n✗ الجدول لا يحتوي على عمود role_id!');
            }
        } catch (err) {
            console.error('خطأ في التحقق من هيكل الجدول:', err.message);
        }
        
        console.log('\nاكتمل تنفيذ الـ SQL. يمكنك الآن إعادة تشغيل التطبيق.');
        await sequelize.close();
    } catch (error) {
        console.error('حدث خطأ:', error);
        process.exit(1);
    }
}

executeSQL();
