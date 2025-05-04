// Minimal mock for redisService to satisfy Jest's mock in jest.setup.js
module.exports = {
    setWithExpiry: async (key, value, expiry) => `mocked-${key}`,
};
