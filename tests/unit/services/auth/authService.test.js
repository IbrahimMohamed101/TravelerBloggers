const AuthService = require('../../../../services/auth/authService');

describe('AuthService', () => {
  let authService;
  let mockDb, mockRedisService, mockTokenService, mockSessionService, mockOauthService, mockEmailService, mockSequelize;
  let mockRegisterService;

  beforeEach(() => {
    // Mocks لل dependencies
    mockDb = {};
    mockRedisService = {};
    mockTokenService = {};
    mockSessionService = { revokeSession: jest.fn() };
    mockOauthService = {};
    mockEmailService = {};
    mockSequelize = {};

    authService = new AuthService(
      mockDb,
      mockRedisService,
      mockTokenService,
      mockSessionService,
      mockOauthService,
      mockEmailService,
      mockSequelize
    );

    // Mocking registerService.register
    mockRegisterService = {
      register: jest.fn()
    };

    // نبدل الـ registerService الحقيقي بالـ mock
    authService.registerService = mockRegisterService;
  });

  test('should register a new user', async () => {
    const mockUserData = { email: 'test@example.com', password: 'password123' };
    const ipAddress = '127.0.0.1';
    const userAgent = 'Mozilla/5.0';

    const expectedResponse = { user: { id: 1, email: mockUserData.email } };

    mockRegisterService.register.mockResolvedValue(expectedResponse);

    const result = await authService.register(mockUserData, ipAddress, userAgent);

    // تأكدنا إن registerService.register اتناديت صح
    expect(mockRegisterService.register).toHaveBeenCalledWith(mockUserData, ipAddress, userAgent);

    // وتأكدنا من النتيجة اللي رجعت
    expect(result).toEqual(expectedResponse);
  });
});
