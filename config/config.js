module.exports = {
    development: {
        username: 'postgres',
        password: '123',
        database: 'TravelerBloggers',
        host: 'localhost',
        dialect: 'postgres'
    },
    test: {
        username: 'traveler_admin',
        password: '1234',
        database: 'TravelerBloggers',
        host: 'localhost',
        dialect: 'postgres'
    },
    production: {
        username: 'traveler_admin',
        password: '1234',
        database: 'TravelerBloggers',
        host: 'localhost',
        dialect: 'postgres'
    }
};
