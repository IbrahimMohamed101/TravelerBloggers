const express = require('express');
const TokenController = require('../../controllers/auth/tokenController');
const verifyJWT = require('../../middlewares/verifyJWT');

module.exports = (container) => {
    const router = express.Router();

    const tokenService = container.getService('tokenService');
    const tokenController = new TokenController(tokenService);

    router.post('/refresh-token', (req, res, next) => tokenController.refreshToken(req, res, next));
    router.post('/revoke-token', (req, res, next) => tokenController.revokeToken(req, res, next));
    router.get('/tokens', verifyJWT(), (req, res, next) => tokenController.listTokens(req, res, next));

    return router;
};
