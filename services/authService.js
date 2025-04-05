const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const axios = require('axios');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/database');
const { generateToken } = require('../utils/generateToken');
const logger = require('../utils/logger');
require('dotenv').config();

class AuthService {
    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        this.User = db.users;
        console.log('AuthService initialized, User model:', !!this.User);
    }

    async registerUserWithOAuth(data) {
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

            let userData = { id: uuidv4(), first_name, last_name, username, email };
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
        const { email, password, google_token, facebook_token, discord_token } = data;

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
                    throw new Error('Invalid email or password');
                }
            }

            if (google_token) {
                await this.verifyGoogleToken(google_token, user);
            }

            if (facebook_token) {
                await this.verifyFacebookToken(facebook_token, user);
            }

            if (discord_token) {
                await this.verifyDiscordToken(discord_token, user);
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
            const user = await this.User.findByPK(userId, {
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
