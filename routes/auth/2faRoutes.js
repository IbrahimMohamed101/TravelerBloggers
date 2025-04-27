const express = require('express');
const router = express.Router();

module.exports = (container) => {
    const authController = container.getController('authController');

    // يمكن إضافة مسارات 2FA هنا حسب الحاجة

    return router;
};
