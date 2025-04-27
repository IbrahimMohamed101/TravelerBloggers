jest.mock('bcrypt', () => ({
    hash: jest.fn((password) => `hashed-${password}`),
}));

jest.mock('./utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));

jest.mock('./utils/withTransaction', () => ({
    withTransaction: (sequelize, callback) => callback(),
}));
