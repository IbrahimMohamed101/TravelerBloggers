const { Strategy } = require('passport-discord');
require('dotenv').config();

module.exports = (passport) => passport.use(
    new Strategy({
        clientID: process.env.discord_Client_ID,
        clientSecret: process.env.discord_Client_Secret,
        callbackURL: process.env.discord_callbackURL,
        scope: ['identify', 'email'],
    }, (accessToken, refreshToken, profile, done) => {
        console.log(profile);
        return done(null, profile);
    })
);

// Serialization handled in passport.js

// Client ID 1356765327773667438

// Client Secret vA4I3Ts-eUkfYn5fuwdFwzin9k16qvF2

// http://localhost:3000/api/auth/discodr/redirect
