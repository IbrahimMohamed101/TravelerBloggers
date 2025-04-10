const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../utils/generateToken');
const logger = require('../utils/logger');
const redis = require('redis');
require('dotenv').config();

// Redis client configuration (optional)
let redisClient;
let redisEnabled = false;

if (process.env.REDIS_URL || process.env.USE_REDIS !== 'false') {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        logger.warn('Max Redis reconnection attempts reached - disabling Redis');
                        redisEnabled = false;
                        return new Error('Max retries reached');
                    }
                    return Math.min(retries * 100, 5000); // Exponential backoff up to 5s
                }
            }
        });

        redisClient.on('error', (err) => {
            logger.warn('Redis connection error:', err.message);
            redisEnabled = false;
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
            redisEnabled = true;
        });

        redisClient.on('reconnecting', () => {
            logger.warn('Redis client reconnecting...');
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
            redisEnabled = true;
        });

        // Graceful shutdown handling
        process.on('SIGINT', async () => {
            if (redisClient && redisEnabled) {
                await redisClient.quit();
            }
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            if (redisClient && redisEnabled) {
                await redisClient.quit();
            }
            process.exit(0);
        });
    } catch (err) {
        logger.warn('Redis initialization failed - running without Redis:', err.message);
        redisEnabled = false;
    }
} else {
    logger.info('Redis disabled by configuration');
    redisEnabled = false;
}

class AuthService {
    constructor(db, auditLogService) {
        this.db = db;
        this.auditLogService = auditLogService;
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        this.initialized = false;
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        try {
            // Ensure models are loaded
            if (!this.db || !this.db.Users) {
                logger.error('Users model not found in database configuration');
                throw new Error('Database configuration error');
            }

            this.User = this.db.Users;
            this.Session = this.db.sessions;
            this.initialized = true;

            // Connect to Redis if enabled
            if (redisEnabled && redisClient) {
                await redisClient.connect();
                logger.info('AuthService initialized successfully with Redis');
            } else {
                logger.info('AuthService initialized without Redis');
            }
        } catch (error) {
            logger.error('AuthService initialization failed:', error);
            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initializationPromise;
        }
    }

    // Redis helper methods
    async setWithExpiry(key, value, ttlSeconds) {
        if (!redisEnabled || !redisClient) {
            logger.warn('Redis not available - skipping set operation');
            return;
        }
        await redisClient.set(key, JSON.stringify(value), {
            EX: ttlSeconds
        });
    }

    async getWithExpiry(key) {
        if (!redisEnabled || !redisClient) {
            logger.warn('Redis not available - returning null for get operation');
            return null;
        }
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }

    async deleteKey(key) {
        if (!redisEnabled || !redisClient) {
            logger.warn('Redis not available - skipping delete operation');
            return;
        }
        await redisClient.del(key);
    }

    async createSession(userId, token, ipAddress, userAgent = null, deviceInfo = null) {
        try {
            logger.debug(`createSession() called with params - userId: ${userId}, token: ${token}, ipAddress: ${ipAddress}, userAgent: ${userAgent}`);

            // Validate and normalize IP address - must be non-null string
            if (!ipAddress || typeof ipAddress !== 'string') {
                logger.warn(`Invalid IP address received: ${ipAddress}, defaulting to 0.0.0.0`);
                ipAddress = '0.0.0.0';
            }

            // Final safety check - ensure we never pass null to the database
            if (ipAddress === null || ipAddress === undefined) {
                ipAddress = '0.0.0.0';
            }

            // Remove any port numbers if present
            ipAddress = ipAddress.split(':')[0];

            // Handle IPv6-mapped IPv4 addresses (::ffff:192.0.2.128)
            let validatedIp = ipAddress.startsWith('::ffff:')
                ? ipAddress.substring(7) // Extract IPv4 part
                : ipAddress;

            logger.debug(`Normalized IP address: ${validatedIp}`);

            logger.debug(`Creating session with normalized IP: ${validatedIp}`);

            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            const session = await this.Session.create({
                user_id: userId,
                token,
                ip_address: validatedIp,
                user_agent: userAgent,
                device_info: deviceInfo,
                expires_at: expiresAt
            });
            return session;
        } catch (error) {
            logger.error(`Error creating session: ${error.message}`);
            throw error;
        }
    }

    async validateSession(token) {
        try {
            const session = await this.Session.findOne({
                where: {
                    token,
                    is_revoked: false,
                    expires_at: { [this.db.Sequelize.Op.gt]: new Date() }
                },
                include: [{ model: this.User }]
            });

            if (!session) {
                throw new Error('Invalid or expired session');
            }

            return session;
        } catch (error) {
            logger.error(`Error validating session: ${error.message}`);
            throw error;
        }
    }

    async revokeSession(token) {
        try {
            const session = await this.Session.findOne({ where: { token } });
            if (!session) {
                throw new Error('Session not found');
            }

            session.is_revoked = true;
            await session.save();
            return true;
        } catch (error) {
            logger.error(`Error revoking session: ${error.message}`);
            throw error;
        }
    }

    async getActiveSessions(userId) {
        try {
            return await this.Session.findAll({
                where: {
                    user_id: userId,
                    is_revoked: false,
                    expires_at: { [this.db.Sequelize.Op.gt]: new Date() }
                },
                order: [['created_at', 'DESC']]
            });
        } catch (error) {
            logger.error(`Error getting active sessions: ${error.message}`);
            throw error;
        }
    }

    // Add account lock check using Redis
    async checkAccountLock(email) {
        const attemptsKey = `failed_attempts:${email}`;
        const lockTimeKey = `lock_time:${email}`;

        // Get current attempts and lock time
        const attempts = parseInt(await redisClient.get(attemptsKey)) || 0;
        const lastAttempt = parseInt(await redisClient.get(lockTimeKey)) || Date.now();

        if (attempts >= 5) {
            const lockTime = Date.now() - lastAttempt;
            if (lockTime < 30 * 60 * 1000) { // 30 minutes lock
                throw new Error('Account locked. Try again later.');
            } else {
                // Reset counters if lock expired
                await redisClient.del(attemptsKey);
                await redisClient.del(lockTimeKey);
            }
        }
    }

    // Add method for password reset using Redis
    async generatePasswordResetToken(email) {
        try {
            const user = await this.User.findOne({ where: { email } });
            if (!user) {
                throw new Error('User not found');
            }

            const token = uuidv4();
            const resetData = {
                email,
                expiresAt: Date.now() + 3600000 // 1 hour expiration
            };

            await this.setWithExpiry(`reset_token:${token}`, resetData, 3600);
            return token;
        } catch (error) {
            logger.error(`Error generating password reset token: ${error.message}`);
            throw error;
        }
    }

    // Add method for resetting password
    async resetPassword(token, newPassword) {
        try {
            const resetData = await this.getWithExpiry(`reset_token:${token}`);
            if (!resetData || resetData.expiresAt < Date.now()) {
                throw new Error('Invalid or expired token');
            }

            const user = await this.User.findOne({ where: { email: resetData.email } });
            if (!user) {
                throw new Error('User not found');
            }

            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
            await this.deleteKey(`reset_token:${token}`);

            return true;
        } catch (error) {
            logger.error(`Error resetting password: ${error.message}`);
            throw error;
        }
    }

    async changePasswordDirectly(userId, currentPassword, newPassword, ipAddress, userAgent) {
        try {
            const user = await this.User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                throw new Error('Current password is incorrect');
            }

            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();

            await this.auditLogService.logEvent(userId, 'PASSWORD_CHANGE', {
                ipAddress,
                userAgent
            });

            return true;
        } catch (error) {
            logger.error(`Error changing password: ${error.message}`);
            throw error;
        }
    }

    // Add method for email verification
    async generateEmailVerificationToken(email) {
        try {
            const user = await this.User.findOne({ where: { email } });
            if (!user) {
                throw new Error('User not found');
            }

            const token = uuidv4();
            await this.setWithExpiry(`verify_email:${token}`, {
                email,
                verified: false
            }, 3600); // 1 hour expiration

            return token;
        } catch (error) {
            logger.error(`Error generating email verification token: ${error.message}`);
            throw error;
        }
    }

    // Add method for verifying email
    async verifyEmail(token, ipAddress, userAgent) {
        try {
            const verificationData = await this.getWithExpiry(`verify_email:${token}`);
            if (!verificationData) {
                throw new Error('Invalid token');
            }

            const user = await this.User.findOne({ where: { email: verificationData.email } });
            if (!user) {
                throw new Error('User not found');
            }

            user.email_verified = true;
            user.email_verified_at = new Date();
            await user.save();
            await this.deleteKey(`verify_email:${token}`);

            await this.auditLogService.logEvent(user.id, 'EMAIL_VERIFIED', {
                ipAddress,
                userAgent
            });

            return true;
        } catch (error) {
            logger.error(`Error verifying email: ${error.message}`);
            throw error;
        }
    }

    // Add method for refresh tokens
    async generateRefreshToken(userId) {
        const token = jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' }
        );

        // Store in database
        await this.Session.create({
            user_id: userId,
            token,
            is_refresh: true,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        return token;
    }

    // Add method to verify refresh token
    async verifyRefreshToken(token) {
        try {
            // Verify JWT signature first
            const secret = process.env.JWT_REFRESH_SECRET || 'secure_fallback_secret_' + require('crypto').randomBytes(32).toString('hex');
            if (!process.env.JWT_REFRESH_SECRET) {
                logger.warn('Using auto-generated JWT_REFRESH_SECRET - for production use, please set JWT_REFRESH_SECRET in your environment');
            }

            const decoded = jwt.verify(token, secret);
            logger.info(`Refresh token verified for user ${decoded.id}, checking database...`);

            // Check if token exists in database
            const session = await this.Session.findOne({
                where: {
                    token,
                    is_refresh: true,
                    is_revoked: false,
                    expires_at: { [this.db.Sequelize.Op.gt]: new Date() }
                }
            });

            if (!session) {
                // Check why it wasn't found
                const revoked = await this.Session.findOne({
                    where: { token, is_refresh: true, is_revoked: true }
                });
                const expired = await this.Session.findOne({
                    expires_at: { [this.db.Sequelize.Op.lt]: new Date() }
                });

                if (revoked) {
                    logger.warn(`Refresh token was revoked: ${token}`);
                    throw new Error('Refresh token was revoked');
                } else if (expired) {
                    logger.warn(`Refresh token expired: ${token}`);
                    throw new Error('Refresh token expired');
                } else {
                    logger.warn(`Refresh token not found in database: ${token}`);
                    throw new Error('Refresh token not found');
                }
            }

            logger.info(`Refresh token valid for user ${decoded.id}`);
            return decoded.id;
        } catch (error) {
            logger.error(`Refresh token verification failed: ${error.message}`, {
                error: error.stack,
                token: token.substring(0, 10) + '...' // Log partial token for security
            });

            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token: ' + error.message);
            }
            throw error; // Re-throw with original message
        }
    }

    // Add method to revoke refresh token
    async revokeRefreshToken(token) {
        try {
            const result = await this.Session.update(
                { is_revoked: true },
                { where: { token, is_refresh: true } }
            );

            if (result[0] === 0) { // No rows updated
                throw new Error('Refresh token not found');
            }
            return true;
        } catch (error) {
            logger.error(`Error revoking refresh token: ${error.message}`);
            throw error;
        }
    }

    async registerUserWithOAuth(data, ipAddress, userAgent) {
        const {
            first_name,
            last_name,
            username,
            email,
            password,
            google_token,
            facebook_token,
            discord_token,
            bio,
            gender,
            social_media,
            interested_categories,
        } = data;

        logger.info(`Attempting to register user with email: ${email}`);

        try {
            const existingUser = await this.User.findOne({ where: { email } });
            if (existingUser) {
                logger.warn(`Registration failed: Email ${email} already exists`);
                throw new Error('Email already exists');
            }

            const existingUsername = await this.User.findOne({ where: { username } });
            if (existingUsername) {
                logger.warn(`Registration failed: Username ${username} already taken`);
                throw new Error('Username already taken');
            }

            let userData = {
                id: uuidv4(),
                first_name,
                last_name,
                username,
                email,
                role: data.role || 'user' // Set role from input or default to 'user'
            };
            if (password) {
                userData.password = await bcrypt.hash(password, 10);
            }

            if (google_token) {
                await this.verifyGoogleToken(google_token, userData);
            }

            if (facebook_token) {
                await this.verifyFacebookToken(facebook_token, userData);
            }

            if (discord_token) {
                await this.verifyDiscordToken(discord_token, userData);
            }

            userData.bio = bio || null;
            userData.gender = gender || null;
            userData.social_media = social_media || {};
            userData.interested_categories = interested_categories || [];

            const newUser = await this.User.create(userData);
            const token = generateToken(newUser);

            // تأجيل تسجيل الحدث حتى يكتمل إنشاء المستخدم
            process.nextTick(async () => {
                try {
                    await this.auditLogService.logEvent(newUser.id, 'REGISTER_SUCCESS', {
                        method: 'OAuth',
                        provider: google_token ? 'Google' : facebook_token ? 'Facebook' : discord_token ? 'Discord' : 'None',
                        ipAddress,
                        userAgent
                    });
                } catch (logError) {
                    logger.error(`Failed to log registration event: ${logError.message}`);
                }
            });

            logger.info(`User registered successfully: ${email}, ID: ${newUser.id}`);
            return {
                user: {
                    id: newUser.id,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                },
                token,
            };
        } catch (error) {
            logger.error(`Error registering user: ${error.message}`);
            throw error;
        }
    }

    async loginUserWithOAuth(data) {
        try {
            // Extract only essential fields immediately
            const { email, password, ipAddress = '0.0.0.0', userAgent = 'unknown' } = data;
            const providerTokens = {
                google: data.google_token,
                facebook: data.facebook_token,
                discord: data.discord_token
            };

            // Minimal logging
            logger.info('Login attempt', {
                email: email.substring(0, 3) + '...@...',
                ip: ipAddress
            });

            // Fetch only required user fields
            const user = await this.User.findOne({
                where: { email },
                attributes: ['id', 'password']
            });

            if (!user) {
                throw new Error('Invalid email or password');
            }

            if (password) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) throw new Error('Invalid email or password');
            }

            // Process provider tokens if present
            if (providerTokens.google) await this.verifyGoogleToken(providerTokens.google, {});
            if (providerTokens.facebook) await this.verifyFacebookToken(providerTokens.facebook, {});
            if (providerTokens.discord) await this.verifyDiscordToken(providerTokens.discord, {});

            // Update last login
            await this.User.update(
                { last_login_at: new Date() },
                { where: { id: user.id } }
            );

            // Generate tokens
            const token = generateToken({ id: user.id });
            const refreshToken = await this.generateRefreshToken(user.id);

            // Create session
            await this.createSession(user.id, token, ipAddress, userAgent);

            // Return minimal user data
            return {
                user: { id: user.id },
                token,
                refreshToken
            };
        } catch (error) {
            logger.error(`Error logging in user: ${error.message}`);
            throw error;
        }
    }

    async verifyGoogleToken(token, userData) {
        const ticket = await this.client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        userData.first_name = payload.given_name;
        userData.last_name = payload.family_name;
    }

    async verifyFacebookToken(token, userData) {
        const response = await axios.get(
            `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,first_name,last_name`
        );
        const fbProfile = response.data;
        userData.first_name = fbProfile.first_name;
        userData.last_name = fbProfile.last_name;
    }

    async verifyDiscordToken(token, userData) {
        const response = await axios.get(
            `https://discord.com/api/users/@me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        );
        const discordProfile = response.data;
        userData.first_name = discordProfile.username; // Discord does not have first/last name
        userData.last_name = ''; // Set last name as empty or handle as needed
    }

    async getUserById(userId) {
        try {
            const user = await this.User.findByPk(userId, {
                attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'role', 'bio', 'gender', 'social_media', 'interested_categories', 'profile_image']
            });

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error(`Error fetching user: ${error.message}`);
            throw error;
        }
    }
}

module.exports = AuthService;
