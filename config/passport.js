const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/users');

passport.serializeUser((user, done) => {
    done(null, user.id); // حفظ معرف المستخدم في الجلسة
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id); // استرجاع المستخدم من قاعدة البيانات
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;

// Initialize strategies
require('../strategy/google-strategy')(passport);
require('../strategy/facebook-strategy')(passport);
require('../strategy/discord-startegy')(passport);