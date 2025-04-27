const RegisterService = require('./registerService');
const LoginService = require('./loginService');
const TokenService = require('./tokenService');
const EmailVerificationService = require('./emailVerificationService');
const AuthHelpers = require('./helpers');

class AuthService {
    constructor(db, redisService, tokenService, sessionService, oauthService, emailService, sequelize) {
        this.db = db;
        this.redisService = redisService;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.oauthService = oauthService;
        this.emailService = emailService;
        this.sequelize = sequelize;

        this.registerService = new RegisterService(db, tokenService, emailService, sessionService, redisService, sequelize);
        this.loginService = new LoginService(db, tokenService, sessionService, redisService);
        this.tokenServiceWrapper = new TokenService(db, tokenService);
        this.emailVerificationService = new EmailVerificationService(db, tokenService, sequelize, emailService);
    }



    async register(userData, ipAddress, userAgent) {
        return await this.registerService.register(userData, ipAddress, userAgent);
    }

    async verifyEmail(token) {
        return await this.emailVerificationService.verifyEmail(token);
    }

    async resendVerificationEmail(userId) {
        return await this.emailVerificationService.resendVerificationEmail(userId);
    }


    async login(email, password, ipAddress, userAgent) {
        return await this.loginService.login(email, password, ipAddress, userAgent);
    }

    async logout(sessionId) {
        try {
            await this.sessionService.revokeSession(sessionId);
            return true;
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        return await this.tokenServiceWrapper.refreshToken(refreshToken);
    }

    async getUserById(userId) {
        try {
            const user = await this.db.users.findByPk(userId);
            return user ? AuthHelpers.sanitizeUser(user) : null;
        } catch (error) {
            logger.error('Get user error:', error);
            throw error;
        }
    }

    // Helper methods
    async _checkAccountLock(email) {
        return this.loginService._checkAccountLock(email);
    }

    async _incrementLoginAttempts(email) {
        return this.loginService._incrementLoginAttempts(email);
    }

    async _resetLoginAttempts(email) {
        return this.loginService._resetLoginAttempts(email);
    }
}

module.exports = AuthService;
