// استيراد dotenv لتحميل المتغيرات البيئية من .env
require('dotenv').config();

const nodemailer = require('nodemailer');

// إعداد الاتصال مع Gmail (أو مزود آخر)
const transporter = nodemailer.createTransport({
    service: 'gmail', // يمكن تغييره إذا كنت تستخدم مزود آخر
    auth: {
        user: process.env.EMAIL_USER, // استخدام البريد من .env
        pass: process.env.EMAIL_PASS, // استخدام كلمة المرور من .env
    },
});

// إرسال البريد الإلكتروني
const sendEmail = async (to, subject, text, html, attachments = []) => {
    // التحقق من المدخلات الأساسية
    if (!to || !subject || !text || !html) {
        throw new Error('Missing required email parameters');
    }

    // التحقق من إعدادات البريد الإلكتروني
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration is missing in .env file');
    }

    try {
        const mailOptions = {
            from: `"Traveler Bloggers" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent to:', to, 'Response:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email to:', to, 'Error:', error);
        throw error;
    }
};

module.exports = sendEmail;
