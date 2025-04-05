const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('../models/users');
const { where } = require('sequelize');

module.exports = (passport) => {
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID, // بتجيبها من Google Cloud Console
            clientSecret: process.env.GOOGLE_CLIENT_SECRET, // بتجيبها من Google Cloud Console
            callbackURL: process.env.GOOGLE_CALLBACK_URL // المسار اللي هيرجع عليه بعد المصادقة
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log('Google profile received:', profile);

                if (!profile.emails || !profile.emails[0]) {
                    throw new Error('No email found in Google profile');
                }

                let user = await User.findOne({ where: { googleId: profile.id } });

                if (!user) {
                    console.log('Creating new user for Google ID:', profile.id);
                    user = await User.create({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName
                    });
                } else {
                    console.log('Found existing user for Google ID:', profile.id);
                }

                return done(null, user);
            } catch (error) {
                console.error('Google authentication error:', error);
                return done(error);
            }
        }
    ))
}