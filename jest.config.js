module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
};
