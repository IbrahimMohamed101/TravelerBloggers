const PasswordService = require('../../../../services/auth/passwordService');
const { ValidationError, UnauthorizedError } = require('../../../../errors/CustomErrors');
const bcrypt = require('bcrypt');

jest.mock('bcrypt');
bcrypt.compare = jest.fn();
bcrypt.hash = jest.fn();

describe('PasswordService', () => {
  let dbMock, redisServiceMock, tokenServiceMock, sequelizeMock, passwordService;

  beforeEach(() => {
    dbMock = {
      users: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
      },
    };

    redisServiceMock = {
      deletePattern: jest.fn(),
      setWithExpiry: jest.fn(),
      getWithExpiry: jest.fn(),
      deleteKey: jest.fn(),
    };

    tokenServiceMock = {}; // ليس مستخدم حاليا لكنه مطلوب بالكونستركتر
    sequelizeMock = {}; // ليس مستخدم فعلياً هنا لكن مطلوب بالكونستركتر

    passwordService = new PasswordService(dbMock, redisServiceMock, tokenServiceMock, sequelizeMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Ensure all timers and pending promises are cleared
    jest.useRealTimers();
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 1;
      const currentPassword = 'oldPass';
      const newPassword = 'newPass';
      const userMock = {
        password: 'hashedOldPassword',
        update: jest.fn(),
      };

      dbMock.users.findOne.mockResolvedValue(userMock);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');
      redisServiceMock.deletePattern.mockResolvedValue(true);

      const result = await passwordService.changePassword(userId, currentPassword, newPassword);

      expect(result).toBe(true);
      expect(userMock.update).toHaveBeenCalledWith({ password: 'hashedNewPassword' }, expect.anything());
      expect(redisServiceMock.deletePattern).toHaveBeenCalledWith(`sessions:${userId}:*`);
    });

    it('should throw ValidationError if user not found', async () => {
      dbMock.users.findOne.mockResolvedValue(null);

      await expect(
        passwordService.changePassword(1, 'oldPass', 'newPass')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError if current password is invalid', async () => {
      const userMock = { password: 'hashedPassword' };
      dbMock.users.findOne.mockResolvedValue(userMock);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        passwordService.changePassword(1, 'wrongPass', 'newPass')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should still succeed even if session revocation fails due to timeout', async () => {
      const userId = 1;
      const currentPassword = 'oldPass';
      const newPassword = 'newPass';
      const userMock = {
        password: 'hashedOldPassword',
        update: jest.fn(),
      };

      dbMock.users.findOne.mockResolvedValue(userMock);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      redisServiceMock.deletePattern.mockRejectedValue(new Error('Operation timed out'));


      const result = await passwordService.changePassword(userId, currentPassword, newPassword);

      expect(result).toBe(true);
      expect(userMock.update).toHaveBeenCalledWith({ password: 'hashedNewPassword' }, expect.anything());
    });
  });

  describe('createPasswordResetToken', () => {
    it('should create a password reset token successfully', async () => {
      const email = 'test@example.com';
      const userId = 1;
      const userMock = { id: userId };
      dbMock.users.findOne.mockResolvedValue(userMock);
      redisServiceMock.setWithExpiry.mockResolvedValue(true);

      const token = await passwordService.createPasswordResetToken(email);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(redisServiceMock.setWithExpiry).toHaveBeenCalled();
    });

    it('should throw ValidationError if user not found', async () => {
      dbMock.users.findOne.mockResolvedValue(null);

      await expect(
        passwordService.createPasswordResetToken('notfound@example.com')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'resetToken';
      const userId = 1;
      const userMock = { update: jest.fn() };

      redisServiceMock.getWithExpiry.mockResolvedValue(userId);
      dbMock.users.findByPk.mockResolvedValue(userMock);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');
      redisServiceMock.deleteKey.mockResolvedValue(true);
      redisServiceMock.deletePattern.mockResolvedValue(true);

      const result = await passwordService.resetPassword(token, 'newPassword');

      expect(result).toBe(true);
      expect(userMock.update).toHaveBeenCalledWith({ password: 'hashedNewPassword' });
      expect(redisServiceMock.deleteKey).toHaveBeenCalled();
      expect(redisServiceMock.deletePattern).toHaveBeenCalledWith(`sessions:${userId}:*`);
    });

    it('should throw ValidationError if reset token is invalid', async () => {
      redisServiceMock.getWithExpiry.mockResolvedValue(null);

      await expect(
        passwordService.resetPassword('invalidToken', 'newPassword')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if user not found during reset', async () => {
      redisServiceMock.getWithExpiry.mockResolvedValue(1);
      dbMock.users.findByPk.mockResolvedValue(null);

      await expect(
        passwordService.resetPassword('validToken', 'newPassword')
      ).rejects.toThrow(ValidationError);
    });
  });

  // Optionally, add this at the end of the file to force Jest to exit after all tests
  afterAll(() => {
    // Close any open handles here if you have any (e.g., DB connections, servers)
  });

  // Remove duplicate afterAll and keep only one to avoid confusion
  afterAll(done => {
    setImmediate(done);
  });
});