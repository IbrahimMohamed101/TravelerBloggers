const UserService = require('../services/user/userService');

describe('UserService', () => {
    let userService;
    let mockDb;
    let mockRedisService;
    let mockTokenService;
    let mockUserModel;

    beforeEach(() => {
        mockUserModel = {
            findByPk: jest.fn(),
            findOne: jest.fn(),
        };
        mockDb = {
            users: mockUserModel,
        };
        mockRedisService = {
            deletePattern: jest.fn(),
        };
        mockTokenService = {};

        userService = new UserService(mockDb, mockRedisService, mockTokenService);
    });

    describe('getProfile', () => {
        it('should return user profile without password', async () => {
            const mockUser = {
                toJSON: () => ({ id: 1, username: 'testuser', password: 'hashedpassword' }),
            };
            mockUserModel.findByPk.mockResolvedValue(mockUser);

            const result = await userService.getProfile(1);

            expect(mockUserModel.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual({ id: 1, username: 'testuser' });
        });

        it('should throw error if user not found', async () => {
            mockUserModel.findByPk.mockResolvedValue(null);

            await expect(userService.getProfile(1)).rejects.toThrow('User not found');
        });
    });

    describe('deleteProfile', () => {
        it('should delete user sessions and user', async () => {
            const mockUser = {
                destroy: jest.fn().mockResolvedValue(true),
            };
            mockUserModel.findByPk.mockResolvedValue(mockUser);
            mockRedisService.deletePattern.mockResolvedValue(true);

            const result = await userService.deleteProfile(1);

            expect(mockUserModel.findByPk).toHaveBeenCalledWith(1);
            expect(mockRedisService.deletePattern).toHaveBeenCalledWith('sessions:1:*');
            expect(mockUser.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should throw error if user not found', async () => {
            mockUserModel.findByPk.mockResolvedValue(null);

            await expect(userService.deleteProfile(1)).rejects.toThrow('User not found');
        });
    });
});
