const EmailVerificationService = require('../../../../services/auth/emailVerificationService');
const { ValidationError, ConflictError } = require('../../../../errors/CustomErrors');
const { withTransaction } = require('../../../../utils/withTransaction.js');
const logger = require('../../../../utils/logger');
const fs = require('fs');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(() => Promise.resolve('<html><body>{{link}}</body></html>')),
  },
}));
const path = require('path');

jest.mock('../../../../utils/withTransaction.js');
jest.mock('../../../../utils/logger');
jest.mock('fs');
jest.mock('../../../../services/auth/tokenService');

describe('EmailVerificationService', () => {
  let dbMock, tokenServiceMock, sequelizeMock, emailServiceMock, emailVerificationService;

  beforeEach(() => {
    dbMock = {
      users: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
      },
    };

    tokenServiceMock = {
      verifyToken: jest.fn(),
      generateToken: jest.fn(),
    };

    sequelizeMock = {}; // ليس مستخدم هنا لكن مطلوب بالكونستركتر
    emailServiceMock = {
      sendEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
    };

    emailVerificationService = new EmailVerificationService(
      dbMock, tokenServiceMock, sequelizeMock, emailServiceMock
    );

    // Remove previous fs.readFile and fs.promises.readFile mocks
    // Only mock fs.readFile as an async function, since the production code uses fs.readFile with a Promise interface
    fs.readFile = jest.fn().mockResolvedValue('<html><body>{{link}}</body></html>');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'validToken';
      const userId = 1;
      const userMock = {
        id: userId,
        email: 'user@example.com',
        email_verified: false,
        email_verified_at: null,
        update: jest.fn(),
        reload: jest.fn(),
        toJSON: jest.fn().mockReturnValue({
          id: userId,
          email: 'user@example.com',
          email_verified: true,
        }),
      };

      tokenServiceMock.verifyToken.mockResolvedValue({
        userId: userId,
        type: 'email_verification',
      });
      dbMock.users.findByPk.mockResolvedValue(userMock);

      const result = await emailVerificationService.verifyEmail(token);

      expect(result.message).toBe('Email verified successfully');
      expect(result.user.email_verified).toBe(true);
      expect(userMock.update).toHaveBeenCalledWith(
        {
          email_verified: true,
          email_verified_at: expect.any(Date),
        },
        expect.anything()
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Email verified successfully for user: user@example.com',
        { userId: userId }
      );
    });

    it('should throw ValidationError if token is invalid', async () => {
      const token = 'invalidToken';
      tokenServiceMock.verifyToken.mockResolvedValue({
        type: 'invalid_type',
      });

      await expect(emailVerificationService.verifyEmail(token)).rejects.toThrow('Invalid verification token');
    });

    it('should throw ValidationError if user not found', async () => {
      const token = 'validToken';
      tokenServiceMock.verifyToken.mockResolvedValue({
        userId: 1,
        type: 'email_verification',
      });
      dbMock.users.findByPk.mockResolvedValue(null);

      await expect(emailVerificationService.verifyEmail(token)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if email already verified', async () => {
      const token = 'validToken';
      const userMock = {
        id: 1,
        email_verified: true,
        update: jest.fn(),
      };

      tokenServiceMock.verifyToken.mockResolvedValue({
        userId: 1,
        type: 'email_verification',
      });
      dbMock.users.findByPk.mockResolvedValue(userMock);

      await expect(emailVerificationService.verifyEmail(token)).rejects.toThrow(ConflictError);
    });
  });

  describe('resendVerificationEmailByIdentifier', () => {
    it('should resend verification email successfully', async () => {
      const userId = 1;
      const userMock = {
        id: userId,
        email: 'user@example.com',
        email_verified: false,
      };
      const token = 'newVerificationToken';
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      tokenServiceMock.generateToken.mockResolvedValue(token);
      dbMock.users.findByPk.mockResolvedValue(userMock);

      const result = await emailVerificationService.resendVerificationEmailByIdentifier({ userId });

      expect(result.message).toBe('Verification email resent successfully');
      expect(tokenServiceMock.generateToken).toHaveBeenCalledWith(
        { userId: userId, type: 'email_verification' },
        '1h'
      );
      expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        token,
        name: '',
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Resent verification email to user: user@example.com',
        { userId: userId }
      );
    });

    it('should throw ValidationError if user not found', async () => {
      const userId = 999;
      dbMock.users.findByPk.mockResolvedValue(null);

      await expect(emailVerificationService.resendVerificationEmailByIdentifier({ userId })).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if email is already verified', async () => {
      const userId = 1;
      const userMock = {
        id: userId,
        email_verified: true,
      };
      dbMock.users.findByPk.mockResolvedValue(userMock);

      await expect(emailVerificationService.resendVerificationEmailByIdentifier({ userId })).rejects.toThrow(ConflictError);
    });
  });
});
