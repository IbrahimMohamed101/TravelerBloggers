const sendEmail = require('../../utils/Nodemailer');
const emailHelper = require('../../utils/emailHelper');

const sendVerificationEmail = async ({ to, token, name }) => {
    const subject = 'Please verify your email address';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/api/v1';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const text = `Hello ${name},

Please verify your email by clicking the following link: ${verificationUrl}

Thank you!`;

    const { html, attachments } = await emailHelper.getEmailVerificationEmail(verificationUrl);

    return sendEmail(to, subject, text, html, attachments);
};

const sendWelcomeEmail = async ({ to, name }) => {
    const subject = 'Welcome to Traveler Bloggers!';
    const text = `Hello ${name},

Welcome to Traveler Bloggers! We're excited to have you on board.

Thank you for joining us.`;

    const { html, attachments } = await emailHelper.getWelcomeEmail(name);

    return sendEmail(to, subject, text, html, attachments);
};

const sendPasswordResetEmail = async ({ to, link }) => {
    const subject = 'Password Reset Request';
    const text = `You requested a password reset. Please click the link below to reset your password:

${link}

If you did not request this, please ignore this email.`;

    const { html, attachments } = await emailHelper.getPasswordResetEmail(link);

    return sendEmail(to, subject, text, html, attachments);
};

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
};
