const LoginService = require('../../../../services/auth/loginService');
const { UnauthorizedError, ConflictError } = require('../../../../errors/CustomErrors');
const bcrypt = require('bcrypt');

// Mocks
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
jest.mock('../../../../utils/logger', () => ({
  error: jest.fn(),
}));

// Mock Data
const mockDb = {
  users: {
    findOne: jest.fn(),
  },
  refresh_tokens: {
    create: jest.fn(),
  },
};
const mockTokenService = {
  generateRefreshToken: jest.fn(),
};
const mockSessionService = {
  createSession: jest.fn(),
  revokeSession: jest.fn(),
};
const mockRedisService = {
  get: jest.fn(),
  getWithExpiry: jest.fn(),
  setWithExpiry: jest.fn(),
  deleteKey: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};


describe('LoginService', () => {
  let loginService;

  beforeEach(() => {
    jest.clearAllMocks();
    loginService = new LoginService(
      mockDb,
      mockTokenService,
      mockSessionService,
      mockRedisService
    );
  });

  const email = 'test@example.com';
  const password = 'password123';
  const ipAddress = '127.0.0.1';
  const userAgent = 'Mozilla/5.0';
  const user = {
    id: 1,
    email: email,
    password: 'hashed-password',
    email_verified: true,
    toJSON: function () { return this; },
  };

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      mockDb.users.findOne.mockResolvedValue(user);
      mockRedisService.get.mockResolvedValue(null);
      bcrypt.compare.mockResolvedValue(true);
      mockSessionService.createSession.mockResolvedValue({ id: 'session-id', token: 'session-token' });
      mockTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

      const result = await loginService.login(email, password, ipAddress, userAgent);

      expect(result).toEqual({
        user: expect.objectContaining({ id: 1, email }),
        token: 'session-token',
        refreshToken: 'refresh-token',
      });

      expect(mockDb.users.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(mockSessionService.createSession).toHaveBeenCalled();
      expect(mockRedisService.setWithExpiry).toHaveBeenCalled();
      expect(mockDb.refresh_tokens.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if user not found', async () => {
      mockDb.users.findOne.mockResolvedValue(null);

      await expect(loginService.login(email, password, ipAddress, userAgent))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if account is locked', async () => {
      mockDb.users.findOne.mockResolvedValue(user);
      mockRedisService.getWithExpiry.mockResolvedValue(5); // Attempts >= 5

      await expect(loginService.login(email, password, ipAddress, userAgent))
        .rejects
        .toThrow('Account is locked. Please try again later');
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      mockDb.users.findOne.mockResolvedValue(user);
      mockRedisService.getWithExpiry.mockResolvedValue(null);
      mockRedisService.exists.mockResolvedValue(false);
      bcrypt.compare.mockResolvedValue(false);

      await expect(loginService.login(email, password, ipAddress, userAgent))
        .rejects
        .toThrow(UnauthorizedError);

      expect(mockRedisService.setWithExpiry).toHaveBeenCalled(); // Increment attempts
    });

    it('should throw ConflictError if email not verified', async () => {
      mockDb.users.findOne.mockResolvedValue({ ...user, email_verified: false });
      mockRedisService.getWithExpiry.mockResolvedValue(null);
      mockRedisService.exists.mockResolvedValue(false);
      bcrypt.compare.mockResolvedValue(true);

      await expect(loginService.login(email, password, ipAddress, userAgent))
        .rejects
        .toThrow(ConflictError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockSessionService.revokeSession.mockResolvedValue(true);

      const result = await loginService.logout('session-id');

      expect(result).toBe(true);
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith('session-id');
    });
  });
});
