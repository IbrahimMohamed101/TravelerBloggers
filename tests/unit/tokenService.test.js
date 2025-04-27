const TokenService = require('../../services/auth/tokenService');

describe('TokenService', () => {
  let service;
  beforeAll(() => {
    service = new TokenService();
  });

  it('generates a valid JWT token', async () => {
    const token = await service.generateToken({ userId: 1 });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('generates a session token with sessionId', async () => {
    const raw = await service.generateSessionToken({ userId: 1, sessionId: 'abc' });
    const payload = JSON.parse(Buffer.from(raw.split('.')[1], 'base64').toString());
    expect(payload).toMatchObject({ userId: 1, sessionId: 'abc' });
  });
});
