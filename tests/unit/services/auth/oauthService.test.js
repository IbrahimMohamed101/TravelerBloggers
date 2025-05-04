const OAuthService = require('../../../../services/auth/oauthService');
const { UnauthorizedError } = require('../../../../errors/CustomErrors');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const logger = require('../../../../utils/logger');

jest.mock('google-auth-library');
jest.mock('axios');
jest.mock('../../../../utils/logger');

describe('OAuthService', () => {
  let oauthService;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    OAuth2Client.mockImplementation(() => ({
      verifyIdToken: jest.fn(),
    }));
    oauthService = new OAuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyGoogleToken', () => {
    it('should return user info for valid token', async () => {
      const mockPayload = {
        email: 'test@example.com',
        name: 'Test User',
        picture: 'pic.jpg',
        sub: 'googleid123',
        email_verified: true,
      };
      oauthService.googleClient.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      });

      const result = await oauthService.verifyGoogleToken('valid-token');
      expect(result).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'pic.jpg',
        googleId: 'googleid123',
        emailVerified: true,
      });
    });

    it('should throw UnauthorizedError for invalid token', async () => {
      oauthService.googleClient.verifyIdToken.mockRejectedValue(new Error('bad token'));

      await expect(oauthService.verifyGoogleToken('bad-token')).rejects.toThrow(UnauthorizedError);
      expect(logger.error).toHaveBeenCalledWith('Google token verification error:', expect.any(Error));
    });
  });

  describe('verifyFacebookToken', () => {
    it('should return user info for valid token', async () => {
      axios.get.mockResolvedValue({
        data: {
          id: 'fbid123',
          name: 'FB User',
          email: 'fb@example.com',
          picture: { data: { url: 'fbpic.jpg' } },
        },
      });

      const result = await oauthService.verifyFacebookToken('fb-token');
      expect(result).toEqual({
        email: 'fb@example.com',
        name: 'FB User',
        picture: 'fbpic.jpg',
        facebookId: 'fbid123',
      });
    });

    it('should throw UnauthorizedError for invalid token', async () => {
      axios.get.mockRejectedValue(new Error('bad fb token'));

      await expect(oauthService.verifyFacebookToken('bad-token')).rejects.toThrow(UnauthorizedError);
      expect(logger.error).toHaveBeenCalledWith('Facebook token verification error:', expect.any(Error));
    });
  });

  describe('verifyDiscordToken', () => {
    it('should return user info for valid token with avatar', async () => {
      axios.get.mockResolvedValue({
        data: {
          id: 'discordid123',
          username: 'DiscordUser',
          email: 'discord@example.com',
          avatar: 'avatarhash',
        },
      });

      const result = await oauthService.verifyDiscordToken('discord-token');
      expect(result).toEqual({
        email: 'discord@example.com',
        name: 'DiscordUser',
        picture: 'https://cdn.discordapp.com/avatars/discordid123/avatarhash.png',
        discordId: 'discordid123',
      });
    });

    it('should return user info for valid token without avatar', async () => {
      axios.get.mockResolvedValue({
        data: {
          id: 'discordid456',
          username: 'NoAvatarUser',
          email: 'noavatar@example.com',
          avatar: null,
        },
      });

      const result = await oauthService.verifyDiscordToken('discord-token');
      expect(result).toEqual({
        email: 'noavatar@example.com',
        name: 'NoAvatarUser',
        picture: null,
        discordId: 'discordid456',
      });
    });

    it('should throw UnauthorizedError for invalid token', async () => {
      axios.get.mockRejectedValue(new Error('bad discord token'));

      await expect(oauthService.verifyDiscordToken('bad-token')).rejects.toThrow(UnauthorizedError);
      expect(logger.error).toHaveBeenCalledWith('Discord token verification error:', expect.any(Error));
    });
  });
});
