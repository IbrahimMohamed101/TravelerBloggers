const sendEmail = require('../../utils/Nodemailer');
const emailHelper = require('../../utils/emailHelper');

const sendVerificationEmail = async ({ to, token, name }) => {
    const subject = 'Please verify your email address';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/api/v1';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const text = `Hello ${name},\n\nPlease verify your email by clicking the following link: ${verificationUrl}\n\nThank you!`;

    const { html, attachments } = await emailHelper.getEmailVerificationEmail(verificationUrl);

    return sendEmail(to, subject, text, html, attachments);
};

module.exports = {
    sendVerificationEmail,
};
