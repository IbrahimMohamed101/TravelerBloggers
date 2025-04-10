const express = require('express');
const router = express.Router();
const emailHelper = require('../utils/emailHelper');

// Mock database connection for testing
router.use((req, res, next) => {
    console.log('Bypassing database connection for test routes');
    next();
});

// Test welcome email route
router.get('/', async (req, res) => {
    try {
        const testEmail = process.env.TEST_EMAIL || 'hemaatar4@gmail.com';
        const testHtml = `
            <h1>Welcome to Traveler Bloggers!</h1>
            <p>This is a test email with logo attachment</p>
            <img src="cid:logo" alt="Traveler Bloggers Logo">
        `;
        const testAttachments = [{
            filename: 'TravelerBloggers.png',
            path: 'TravelerBloggers.png',
            cid: 'logo'
        }];

        await require('../utils/Nodemailer')(
            testEmail,
            'Test Welcome Email',
            'Plain text version of test email',
            testHtml,
            testAttachments
        );
        res.send('Test welcome email sent successfully - check your inbox');
    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).send(`Test email failed: ${error.message}`);
    }
});

// Test password reset email route
router.get('/password-reset-test', async (req, res) => {
    try {
        const testEmail = process.env.TEST_EMAIL || 'hemaatar4@gmail.com';
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=test-token-123`;

        const { html, attachments } = await emailHelper.getPasswordResetEmail(resetLink);

        await require('../utils/Nodemailer')(
            testEmail,
            'Test Password Reset Email',
            `Password Reset Test\n\nReset link: ${resetLink}`,
            html,
            attachments
        );

        res.send('Test password reset email sent successfully - check your inbox');
    } catch (error) {
        console.error('Password reset test failed:', error);
        res.status(500).send(`Password reset test failed: ${error.message}`);
    }
});

module.exports = router;
