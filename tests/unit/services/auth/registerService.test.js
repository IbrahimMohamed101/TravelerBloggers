const RegisterService = require('../../../../services/auth/registerService');
const { ConflictError } = require('../../../../errors/CustomErrors');
const bcrypt = require('bcrypt');

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => `hashed-${password}`),
}));

// Mock logger
jest.mock('../../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Mock withTransaction
jest.mock('../../../../utils/withTransaction', () => ({
  withTransaction: (sequelize, callback) => callback(),
}));

// Mocks
const mockDb = {
  users: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  role: {
    findOne: jest.fn(),
  },
};
const mockTokenService = {
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
};
const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};
const mockSessionService = {
  createSession: jest.fn(),
};
const mockRedisService = {
  setWithExpiry: jest.fn(),
};
const mockSequelize = {}; // مش مهم خلاص

// Factory Functions
const createFakeUserData = () => ({
  email: `user${Date.now()}@example.com`,
  password: 'password123',
  name: `Test User ${Math.floor(Math.random() * 1000)}`,
});

const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role_id: 1,
  emailVerified: false,
  toJSON: function () { return this; },
  ...overrides,
});

describe('RegisterService', () => {
  let registerService;
  let userData;
  let ipAddress;
  let userAgent;

  beforeEach(() => {
    jest.clearAllMocks();

    // Fresh data every test
    userData = createFakeUserData();
    ipAddress = '127.0.0.1';
    userAgent = 'Mozilla/5.0';

    // Default mocks
    mockDb.users.findOne.mockResolvedValue(null);
    mockDb.role.findOne.mockResolvedValue({ id: 1 });
    mockDb.users.create.mockResolvedValue(createMockUser());
    mockTokenService.generateToken.mockResolvedValue('verification-token');
    mockSessionService.createSession.mockResolvedValue({ id: 'session-id', token: 'session-token' });
    mockTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

    registerService = new RegisterService(
      mockDb,
      mockTokenService,
      mockEmailService,
      mockSessionService,
      mockRedisService,
      mockSequelize
    );
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await registerService.register(userData, ipAddress, userAgent);

      expect(result.user).toHaveProperty('email', userData.email);
      expect(result).toHaveProperty('token', 'session-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
    });

    it('should throw ConflictError if email already exists', async () => {
      mockDb.users.findOne.mockResolvedValue(createMockUser());

      await expect(registerService.register(userData, ipAddress, userAgent))
        .rejects
        .toThrow(ConflictError);

      expect(mockDb.users.create).not.toHaveBeenCalled();
    });

    it('should throw an error if default role not found', async () => {
      mockDb.role.findOne.mockResolvedValue(null);

      await expect(registerService.register(userData, ipAddress, userAgent))
        .rejects
        .toThrow('Default role not found');
    });

    it('should sanitize user correctly even if toJSON is missing', async () => {
      mockDb.users.create.mockResolvedValue({
        id: 2,
        email: userData.email,
        name: userData.name,
        role_id: 1,
        emailVerified: false,
        password: 'hashed-password123',
      });

      const result = await registerService.register(userData, ipAddress, userAgent);

      expect(result.user).not.toHaveProperty('password');
    });
  });
});
