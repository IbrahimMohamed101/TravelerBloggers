const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const { generateToken } = require('../utils/generateToken');
const logger = require('../utils/logger');

class AuthService {
    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        this.User = db.users;
    }

    async registerUser(data) {
        const {
            first_name,
            last_name,
            username,
            email,
            password,
            google_token,
            bio,
            gender,
            social_media,
            interested_categories,
        } = data;

        logger.info(`Attempting to register user with email: ${email}`);

        // التحقق من التكرار
        const [existingUser, existingUsername] = await Promise.all([
            this.User.findOne({ where: { email } }),
            this.User.findOne({ where: { username } })
        ]);


        let userData = { id: uuidv4(), first_name, last_name, username, email };

        // التسجيل العادي
        if (password) {
            userData.password = await bcrypt.hash(password, 10);
            logger.info(`Password hashed for user: ${email}`);
        }

        // التسجيل بـ Google
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
            userData.first_name = payload.given_name || first_name;
            userData.last_name = payload.family_name || last_name;
            logger.info(`Google OAuth verified for user: ${email}`);
        }

        // الحقول الاختيارية
        userData.bio = bio || null;
        userData.gender = gender || null;
        userData.social_media = social_media || {};
        userData.interested_categories = interested_categories || [];

        // إنشاء المستخدم
        const newUser = await this.User.create(userData);
        const token = generateToken(newUser);

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
    }
}

module.exports = AuthService;