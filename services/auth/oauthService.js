const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { UnauthorizedError } = require('../../errors/CustomErrors');

const logger = require('../../utils/logger');

class OAuthService {
    constructor() {
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async verifyGoogleToken(token) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            return {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                googleId: payload.sub,
                emailVerified: payload.email_verified
            };
        } catch (error) {
            logger.error('Google token verification error:', error);
            throw new UnauthorizedError('Invalid Google token');
        }
    }

    async verifyFacebookToken(token) {
        try {
            const response = await axios.get('https://graph.facebook.com/me', {
                params: {
                    fields: 'id,name,email,picture',
                    access_token: token
                }
            });

            const { id, name, email, picture } = response.data;
            return {
                email,
                name,
                picture: picture?.data?.url,
                facebookId: id
            };
        } catch (error) {
            logger.error('Facebook token verification error:', error);
            throw new UnauthorizedError('Invalid Facebook token');
        }
    }

    async verifyDiscordToken(token) {
        try {
            const response = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const { id, username, email, avatar } = response.data;
            return {
                email,
                name: username,
                picture: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
                discordId: id
            };
        } catch (error) {
            logger.error('Discord token verification error:', error);
            throw new UnauthorizedError('Invalid Discord token');
        }
    }
}

module.exports = OAuthService;
