const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/database');
const { generateToken } = require('../utils/generateToken');
const logger = require('../utils/logger');

class AuthService {
    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        this.User = db.users;
        console.log('AuthService initialized, User model:', !!this.User); // نقطة تفتيش 1
    }

    async registerUser(data) {
        const {
            first_name,
            last_name,
            username,
            email,
            password,
            google_token,
            facebook_token,
            bio,
            gender,
            social_media,
            interested_categories,
        } = data;

        logger.info(`Attempting to register user with email: ${email}`);
        console.log('Step 0: Data received:', data); // نقطة تفتيش 0

        try {
            console.log('Step 1: Checking existing email'); // نقطة تفتيش 1
            const existingUser = await this.User.findOne({ where: { email } });
            if (existingUser) {
                logger.warn(`Registration failed: Email ${email} already exists`);
                throw new Error('Email already exists');
            }

            console.log('Step 2: Checking existing username'); // نقطة تفتيش 2
            const existingUsername = await this.User.findOne({ where: { username } });
            if (existingUsername) {
                logger.warn(`Registration failed: Username ${username} already taken`);
                throw new Error('Username already taken');
            }

            let userData = { id: uuidv4(), first_name, last_name, username, email };
            logger.debug(`User data initialized: ${JSON.stringify(userData)}`);
            console.log('Step 3: User data initialized'); // نقطة تفتيش 3

            if (password) {
                console.log('Step 4: Hashing password'); // نقطة تفتيش 4
                userData.password = await bcrypt.hash(password, 10);
                logger.info(`Password hashed for user: ${email}`);
            }

            if (google_token) {
                console.log('Step 5: Verifying Google token'); // نقطة تفتيش 5
                const ticket = await this.client.verifyIdToken({
                    idToken: google_token,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                if (payload.email !== email) {
                    logger.error(`Google token mismatch for email: ${email}`);
                    throw new Error('Google token email mismatch');
                }
                userData.first_name = payload.given_name || first_name;
                userData.last_name = payload.family_name || last_name;
                logger.info(`Google OAuth verified for user: ${email}`);
            }

            if (facebook_token) {
                // Register with Facebook
                try {
                    const response = await axios.get(
                        `https://graph.facebook.com/me?access_token=${facebook_token}&fields=id,name,email,first_name,last_name`
                    );
                    const fbProfile = response.data;
                    if (!fbProfile.email || fbProfile.email !== email) {
                        logger.error(`Facebook token mismatch for email: ${email}`);
                        throw new Error('Facebook token email mismatch');
                    }
                    // تحديث بيانات المستخدم بناءً على بيانات فيسبوك
                    userData.first_name = fbProfile.first_name || first_name;
                    userData.last_name = fbProfile.last_name || last_name;
                    logger.info(`Step 4: Facebook OAuth verified for user: ${email}`);
                } catch (error) {
                    logger.error(`Error verifying Facebook token: ${error.message}`);
                    throw new Error('Invalid Facebook token');
                }
            }


            userData.bio = bio || null;
            userData.gender = gender || null;
            userData.social_media = social_media || {};
            userData.interested_categories = interested_categories || [];
            logger.debug(`Full user data before creation: ${JSON.stringify(userData)}`);
            console.log('Step 6: Prepared full user data'); // نقطة تفتيش 6

            console.log('Step 7: Creating user in DB'); // نقطة تفتيش 7
            const newUser = await this.User.create(userData);
            logger.info(`User created in DB: ${newUser.id}`);

            console.log('Step 8: Generating token'); // نقطة تفتيش 8
            const token = generateToken(newUser);
            logger.info(`Token generated for user: ${email}`);

            logger.info(`User registered successfully: ${email}, ID: ${newUser.id}`);
            console.log('Step 9: Registration complete'); // نقطة تفتيش 9

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
            logger.error(`Error registering user: ${error.message}, Stack: ${error.stack}`);
            console.log('Error caught at step:', error.message); // نقطة تفتيش للخطأ
            throw error;
        }
    }

    async loginUser(data) {
        const { email, password, google_token, facebook_token } = data;

        logger.info(`Attempting to login user with email: ${email}`);

        try {
            const user = await this.User.findOne({ where: { email } });
            if (!user) {
                logger.warn(`Login failed: User with email ${email} not found`);
                throw new Error('Invalid email or password');
            }

            if (password) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    logger.warn(`Login failed: Incorrect password for email ${email}`);
                    throw new Error(`Password verified for user: ${email}`);
                }
                logger.info(`Password verified for user: ${email}`);
            }

            if (google_token) {
                const ticket = await this.client.verifyIdToken({
                    idToken: google_token,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                if (payload.email !== email) {
                    logger.error(`Google token mismatch for email: ${email}`);
                    throw new Error('Google token email mismatch');
                }
                logger.info(`Google OAuth verified for user: ${email}`);
            }

            if (facebook_token) {
                // تسجيل الدخول باستخدام Facebook
                try {
                    const response = await axios.get(
                        `https://graph.facebook.com/me?access_token=${facebook_token}&fields=id,name,email`
                    );
                    const fbProfile = response.data;
                    if (!fbProfile.email || fbProfile.email !== email) {
                        logger.error(`Facebook token mismatch for email: ${email}`);
                        throw new Error('Facebook token email mismatch');
                    }
                    logger.info(`Facebook OAuth verified for user: ${email}`);
                } catch (error) {
                    logger.error(`Error verifying Facebook token: ${error.message}`);
                    throw new Error('Invalid Facebook token');
                }
            }
            const token = generateToken(user);
            logger.info(`Login successful for user: ${email}, ID: ${user.id}`);

            return {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                token,
            };
        } catch (error) {
            logger.error(`Error logging in user: ${error.message}, Stack: ${error.stack}`);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            logger.info(`Fetching user with ID: ${userId}`);
            const user = await this.User.findByPK(userId, {
                // Log the user ID being fetched

                // Log the user ID being fetched
                attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'role', 'bio', 'gender', 'social_media', 'interested_categories', 'profile_image']
            });

            if (!user) {
                logger.warn(`User not found: ${userId}`);
                // Log the error for better debugging
                logger.error(`Error fetching user: User with ID ${userId} does not exist.`);

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
