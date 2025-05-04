const { globalLimiter, sensitiveLimiter } = require('../../../middlewares/rateLimiter');

describe('RateLimiter Middleware', () => {
  test.todo('should respond 429 when rate limit exceeded for globalLimiter');
  test.todo('should respond 429 when rate limit exceeded for sensitiveLimiter');
  test.todo('should allow requests under the limit');
});
