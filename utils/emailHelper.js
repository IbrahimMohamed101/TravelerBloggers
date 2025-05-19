const fs = require('fs');
const path = require('path');

class EmailHelper {
    constructor() {
        this.templatesPath = path.join(__dirname, 'emailTemplates');
    }

    async loadTemplate(templateName, variables = {}) {
        try {
            const filePath = path.join(this.templatesPath, `${templateName}.html`);
            let content = await fs.promises.readFile(filePath, 'utf8');

            // Replace variables in template
            for (const [key, value] of Object.entries(variables)) {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }

            return {
                html: content,
                attachments: [{
                    filename: 'TravelerBloggers.png',
                    path: './TravelerBloggers.png',
                    cid: 'TravelerBloggers.png'
                }]
            };
        } catch (error) {
            console.error(`Error loading email template ${templateName}:`, error);
            throw error;
        }
    }

    async getWelcomeEmail(name) {
        return this.loadTemplate('welcome', { name });
    }

    async getPasswordResetEmail(link) {
        return this.loadTemplate('passwordReset', { link });
    }

    async getEmailVerificationEmail(link) {
        return this.loadTemplate('emailVerification', { link });
    }
}

module.exports = new EmailHelper();
