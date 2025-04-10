const AuthService = require('./services/authService');
const db = require('./config/database');
const authService = new AuthService();

async function generateTestToken() {
    try {
        // إنشاء مستخدم اختبار
        const testUser = await db.users.create({
            email: 'testuser@example.com',
            password: 'testpassword',
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser_' + Date.now()
        });

        // إنشاء refresh token
        const refreshToken = await authService.generateRefreshToken(testUser.id);
        console.log('Refresh Token:', refreshToken);
        console.log('User ID:', testUser.id);

        return { refreshToken, userId: testUser.id };
    } catch (error) {
        console.error('Error generating test token:', error);
        throw error;
    }
}

generateTestToken();
