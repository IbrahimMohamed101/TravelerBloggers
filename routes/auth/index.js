const express = require('express');
const router = express.Router();

const registerRoutes = require('./registerRoutes');
const loginRoutes = require('./loginRoutes');
const oauthRoutes = require('./oauthRoutes');
const twoFARoutes = require('./2faRoutes');
const sessionRoutes = require('./sessionRoutes');
const tokenRoutes = require('./tokenRoutes');

module.exports = (container) => {
    router.use(registerRoutes(container));
    router.use(loginRoutes(container));
    router.use('/oauth', oauthRoutes(container));
    router.use(twoFARoutes(container));
    router.use(sessionRoutes(container));
    router.use(tokenRoutes(container));

    return router;
};
