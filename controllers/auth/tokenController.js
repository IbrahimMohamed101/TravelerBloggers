const TokenService = require('../../services/auth/tokenService');
const { UnauthorizedError, BadRequestError } = require('../../errors/CustomErrors');

class TokenController {
    constructor(tokenService) {
        this.tokenService = tokenService;
    }

    // POST /auth/refresh-token
    async refreshToken(req, res, next) {
        try {
            // Accept both camelCase and snake_case for refresh token
            let refreshToken = req.body.refreshToken || req.body.refresh_token;
            // Remove all whitespace and trim
            if (typeof refreshToken === 'string') {
                refreshToken = refreshToken.replace(/\s/g, '').trim();
            }
            // If still falsy after trimming, throw error
            if (!refreshToken) {
                return res.status(400).json({ message: '"refresh_token" is required' });
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
                is_revoked: false,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            res.json({ token: tokenData.token, refreshToken: newRefreshToken });
        } catch (error) {
            // Always send error in the expected format for this endpoint
            if (error && error.message === '"refresh_token" is required') {
                return res.status(400).json({ message: '"refresh_token" is required' });
            }
            next(error);
        }
    }

    // POST /auth/revoke-token
    async revokeToken(req, res, next) {
        try {
            // Accept both camelCase and snake_case for refresh token
            const refreshToken = req.body.refreshToken || req.body.refresh_token;
            if (!refreshToken) {
                // Match error message format: "refresh_token" is required
                throw new BadRequestError('"refresh_token" is required');
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
