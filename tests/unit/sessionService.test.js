const SessionService = require('../../services/auth/sessionService');

describe('SessionService', () => {
  let redisMock, tokenMock, service;

  beforeEach(() => {
    redisMock = { setWithExpiry: jest.fn(), addToList: jest.fn() };
    tokenMock = { generateSessionToken: jest.fn().mockResolvedValue('FAKE.TOKEN') };
    service = new SessionService(redisMock, tokenMock);
  });

  it('createSession stores session and returns sessionId and token', async () => {
    const result = await service.createSession(5, '127.0.0.1', 'UA', 'device');
    expect(result).toHaveProperty('sessionId');
    expect(result.token).toBe('FAKE.TOKEN');
    expect(redisMock.setWithExpiry).toHaveBeenCalledWith(
      expect.stringMatching(/^session:/),
      expect.objectContaining({ token: 'FAKE.TOKEN' }),
      86400
    );
    expect(redisMock.addToList).toHaveBeenCalledWith(
      'user_sessions:5',
      expect.any(String),
      86400
    );
  });
});
