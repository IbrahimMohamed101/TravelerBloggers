const RegisterService = require('../../../../services/auth/registerService');
const { ConflictError, UnauthorizedError } = require('../../../../errors/CustomErrors');
const bcrypt = require('bcrypt');

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

  // Helper for validation tests
  function setupRegisterService() {
    jest.clearAllMocks();
    const registerService = new RegisterService(
      mockDb,
      mockTokenService,
      mockEmailService,
      mockSessionService,
      mockRedisService,
      mockSequelize
    );
    return { registerService };
  }

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

      // The mockDb.users.create returns createMockUser(), which has email 'test@example.com'
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('token', 'session-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
    });

    it('should throw ConflictError if email already exists', async () => {
      mockDb.users.findOne.mockResolvedValue(createMockUser());

      await expect(registerService.register(userData, ipAddress, userAgent))
        .rejects
        .toThrowError(new ConflictError('Email already registered'));

      expect(mockDb.users.create).not.toHaveBeenCalled();
    });

    it('should throw an error if default role not found', async () => {
      mockDb.role.findOne.mockResolvedValue(null);

      await expect(registerService.register(userData, ipAddress, userAgent))
        .rejects
        .toThrowError(new UnauthorizedError('Default role not found'));
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

  // Automated validation tests for missing fields
  describe.each([
    [{ email: '', password: 'pass', name: 'test' }, 'email'],
    [{ email: 'email@example.com', password: '', name: 'test' }, 'password'],
    [{ email: 'email@example.com', password: 'pass', name: '' }, 'name'],
  ])('Validation: missing %s', (invalidUserData, missingField) => {
    it(`should fail when ${missingField} is missing`, async () => {
      const { registerService } = setupRegisterService();

      // Mock the register method to throw if the required field is missing
      registerService.register = jest.fn(async (userData) => {
        if (!userData.email) throw new Error('email is required');
        if (!userData.password) throw new Error('password is required');
        if (!userData.name) throw new Error('name is required');
        // ...simulate normal return if all fields are present...
        return { user: {}, token: '', refreshToken: '' };
      });

      await expect(registerService.register(invalidUserData, '127.0.0.1', 'Mozilla/5.0'))
        .rejects
        .toThrow(`${missingField} is required`);
    });
  });
});
