const TokenService = require('../../../../services/auth/tokenService');
const { UnauthorizedError } = require('../../../../errors/CustomErrors');
const jwt = require('jsonwebtoken');
const logger = require('../../../../utils/logger');

jest.mock('jsonwebtoken');
jest.mock('../../../../utils/logger');

describe('TokenService', () => {
    let tokenService, redisServiceMock, dbMock;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_TOKEN_SECRET = 'refresh-secret';
        redisServiceMock = {};
        dbMock = {
            refresh_tokens: {
                create: jest.fn(),
                findOne: jest.fn(),
                findAll: jest.fn(),
            },
        };
        tokenService = new TokenService(redisServiceMock, dbMock);
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('should generate a JWT token', async () => {
            jwt.sign.mockReturnValue('signed-token');
            const result = await tokenService.generateToken({ userId: 1 });
            expect(result).toBe('signed-token');
            expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, 'test-secret', { expiresIn: '1h' });
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', async () => {
            jwt.verify.mockReturnValue({ userId: 1 });
            const result = await tokenService.verifyToken('token');
            expect(result).toEqual({ userId: 1 });
            expect(jwt.verify).toHaveBeenCalledWith('token', 'test-secret');
        });

        it('should throw UnauthorizedError for invalid token', async () => {
            jwt.verify.mockImplementation(() => { throw new Error('bad'); });
            await expect(tokenService.verifyToken('bad')).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate and store refresh token if db is present', async () => {
            jwt.sign.mockReturnValue('refresh-token');
            dbMock.refresh_tokens.create.mockResolvedValue({});
            const result = await tokenService.generateRefreshToken(1);
            expect(result).toBe('refresh-token');
            expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, 'refresh-secret', { expiresIn: '7d' });
            expect(dbMock.refresh_tokens.create).toHaveBeenCalledWith(
                expect.objectContaining({ token: 'refresh-token', user_id: 1, is_revoked: false }),
                { transaction: null }
            );
        });

        it('should generate refresh token without db', async () => {
            tokenService = new TokenService(redisServiceMock, null);
            jwt.sign.mockReturnValue('refresh-token');
            const result = await tokenService.generateRefreshToken(1);
            expect(result).toBe('refresh-token');
        });
    });

    describe('verifyRefreshToken', () => {
        it('should verify a valid refresh token', async () => {
            jwt.verify.mockReturnValue({ userId: 1 });
            const result = await tokenService.verifyRefreshToken('refresh-token');
            expect(result).toEqual({ userId: 1 });
            expect(jwt.verify).toHaveBeenCalledWith('refresh-token', 'refresh-secret');
        });

        it('should throw UnauthorizedError for invalid refresh token', async () => {
            jwt.verify.mockImplementation(() => { throw new Error('bad'); });
            await expect(tokenService.verifyRefreshToken('bad')).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('refreshToken', () => {
        it('should refresh token if valid and not revoked', async () => {
            jwt.verify.mockReturnValue({ userId: 1 });
            dbMock.refresh_tokens.findOne.mockResolvedValue({ token: 'refresh-token', is_revoked: false });
            tokenService.generateToken = jest.fn().mockResolvedValue('new-token');
            const result = await tokenService.refreshToken('refresh-token');
            expect(result).toEqual({ token: 'new-token', userId: 1 });
        });

        it('should throw UnauthorizedError if payload is invalid', async () => {
            jwt.verify.mockReturnValue({});
            await expect(tokenService.refreshToken('refresh-token')).rejects.toThrow(UnauthorizedError);
        });

        it('should throw UnauthorizedError if token is revoked', async () => {
            jwt.verify.mockReturnValue({ userId: 1 });
            dbMock.refresh_tokens.findOne.mockResolvedValue(null);
            await expect(tokenService.refreshToken('refresh-token')).rejects.toThrow(UnauthorizedError);
        });

        it('should call logger.error and rethrow on error', async () => {
            jwt.verify.mockImplementation(() => { throw new Error('fail'); });
            await expect(tokenService.refreshToken('bad')).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith('Token refresh error:', expect.any(Error));
        });
    });

    describe('revokeToken', () => {
        it('should revoke token if found', async () => {
            const saveMock = jest.fn();
            dbMock.refresh_tokens.findOne.mockResolvedValue({ save: saveMock });
            await tokenService.revokeToken('refresh-token');
            expect(dbMock.refresh_tokens.findOne).toHaveBeenCalledWith({ where: { token: 'refresh-token' } });
            expect(saveMock).toHaveBeenCalled();
        });

        it('should throw UnauthorizedError if token not found', async () => {
            dbMock.refresh_tokens.findOne.mockResolvedValue(null);
            await expect(tokenService.revokeToken('refresh-token')).rejects.toThrow(UnauthorizedError);
        });

        it('should call logger.error and rethrow on error', async () => {
            dbMock.refresh_tokens.findOne.mockImplementation(() => { throw new Error('fail'); });
            await expect(tokenService.revokeToken('refresh-token')).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith('Token revoke error:', expect.any(Error));
        });
    });

    describe('listActiveTokens', () => {
        it('should list active tokens if db is present', async () => {
            dbMock.refresh_tokens.findAll.mockResolvedValue([{ token: 't1' }]);
            const result = await tokenService.listActiveTokens(1);
            expect(result).toEqual([{ token: 't1' }]);
        });

        it('should return empty array if db is not present', async () => {
            tokenService = new TokenService(redisServiceMock, null);
            const result = await tokenService.listActiveTokens(1);
            expect(result).toEqual([]);
        });

        it('should call logger.error and rethrow on error', async () => {
            dbMock.refresh_tokens.findAll.mockImplementation(() => { throw new Error('fail'); });
            await expect(tokenService.listActiveTokens(1)).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith('List tokens error:', expect.any(Error));
        });
    });

    describe('generateSessionToken', () => {
        it('should generate a session token', async () => {
            tokenService.generateToken = jest.fn().mockResolvedValue('session-token');
            const result = await tokenService.generateSessionToken({ userId: 1, sessionId: 'abc' });
            expect(result).toBe('session-token');
            expect(tokenService.generateToken).toHaveBeenCalledWith({ userId: 1, sessionId: 'abc' }, '15m');
        });
    });
});
