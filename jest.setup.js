// Mocks
jest.mock('bcrypt', () => ({
    hash: jest.fn((password) => `hashed-${password}`),
}));

jest.mock('./utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));

jest.mock('./utils/withTransaction', () => ({
    withTransaction: async (sequelize, callback) => {
        try {
            console.log('Starting fake transaction...');
            const result = await callback({ commit: jest.fn(), rollback: jest.fn() });
            console.log('Committing fake transaction...');
            return result;
        } catch (err) {
            console.log('Rolling back fake transaction...');
            throw err;
        }
    }
}));

jest.mock('./services/cache/redisService', () => ({
    setWithExpiry: jest.fn((key, value, expiry) => Promise.resolve(`mocked-${key}`)),
}));
