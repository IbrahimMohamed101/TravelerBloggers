const bcrypt = require('bcryptjs');
const { ConflictError, UnauthorizedError } = require('../../errors/CustomErrors');
const logger = require('../../utils/logger');
const { withTransaction } = require('../../utils/withTransaction.js');

class RegisterService {
    constructor(db, tokenService, emailService, sessionService, redisService, sequelize) {
        this.db = db;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.sessionService = sessionService;
        this.redisService = redisService;
        this.sequelize = sequelize;
    }

    async register(userData, ipAddress, userAgent) {
        return await withTransaction(this.sequelize, async (transaction) => {
            const existingUser = await this.db.users.findOne({
                where: { email: userData.email },
                transaction
            });

            if (existingUser) {
                throw new ConflictError('Email already registered');
            }

            const hashedPassword = await bcrypt.hash(userData.password, 12);

            const defaultRole = await this.db.role.findOne({
                where: { name: 'user' },
                transaction
            });

            if (!defaultRole) {
                throw new UnauthorizedError('Default role not found');
            }

            const user = await this.db.users.create({
                ...userData,
                password: hashedPassword,
                role_id: defaultRole.id,
                emailVerified: false,
                createdAt: new Date(),
            }, { transaction });

            const verificationToken = await this.tokenService.generateToken(
                { userId: user.id, type: 'email_verification' },
                '24h'
            );

            await this.emailService.sendVerificationEmail({
                to: user.email,
                token: verificationToken,
                name: user.name,
            });

            const session = await this.sessionService.createSession(
                user.id,
                ipAddress,
                userAgent
            );

            await this.redisService.setWithExpiry(
                `session:${session.id}`,
                session,
                24 * 60 * 60
            );

            const refreshToken = await this.tokenService.generateRefreshToken(user.id, '7d', transaction);

            // Removed redundant refresh_tokens.create call since generateRefreshToken already creates the record

            return {
                user: this.#sanitizeUser(user),
                token: session.token,
                refreshToken: refreshToken
            };
        });
    }

    #sanitizeUser(user) {
        const { password, ...safeUser } = user.toJSON ? user.toJSON() : user;
        return safeUser;
    }
}

module.exports = RegisterService;
