const TokenService = require('../../services/auth/tokenService');
const { UnauthorizedError, BadRequestError } = require('../../errors/CustomErrors');

class TokenController {
    constructor(tokenService) {
        this.tokenService = tokenService;
    }

    // POST /auth/refresh-token
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new BadRequestError('Refresh token is required');
            }
            // Rotate refresh token: revoke old and issue new
            const tokenData = await this.tokenService.refreshToken(refreshToken);
            // Revoke old refresh token
            await this.tokenService.revokeToken(refreshToken);
            // Generate new refresh token
            const newRefreshToken = await this.tokenService.generateRefreshToken(tokenData.userId);
            // Store new refresh token in DB
            await this.tokenService.db.refresh_tokens.create({
                token: newRefreshToken,
                user_id: tokenData.userId,
                revoked: false,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            res.json({ token: tokenData.token, refreshToken: newRefreshToken });
        } catch (error) {
            next(error);
        }
    }

    // POST /auth/revoke-token
    async revokeToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new BadRequestError('Refresh token is required');
            }
            await this.tokenService.revokeToken(refreshToken);
            res.json({ message: 'Refresh token revoked successfully' });
        } catch (error) {
            next(error);
        }
    }

    // GET /auth/tokens (optional) - list active tokens for user
    async listTokens(req, res, next) {
        try {
            const userId = req.user.id;
            const tokens = await this.tokenService.listActiveTokens(userId);
            res.json(tokens);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TokenController;
