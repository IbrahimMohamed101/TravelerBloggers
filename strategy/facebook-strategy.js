const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/users'); // استيراد موديل المستخدم

module.exports = (passport) => {
    passport.use(
        new FacebookStrategy({
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name', 'photos'],
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ where: { facebookId: profile.id } });
                if (!user) {
                    user = await User.create({
                        facebookId: profile.id,
                        email: profile.emails[0].value,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        profilePicture: profile.photos[0].value,
                    });
                }

                return done(null, user);
            } catch (error) {
                done(error);
            }
        })
    );
};
