const request = require('supertest');
const app = require('../../index');

describe('Auth Routes Integration', () => {
  it('should return 400 for login missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/);
  });

  it('should handle refresh token missing or invalid', async () => {
    const res = await request(app).post('/api/v1/auth/refresh-token').send({});
    expect(res.status).toBe(400);
  });
});
