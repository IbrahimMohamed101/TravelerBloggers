const express = require('express');
const router = express.Router();

const blogRoutes = require('./blogRoutes');
const categoryRoutes = require('./categoryRoutes');
const tagRoutes = require('./tagRoutes');

module.exports = (Container) => {
    router.use('/blog', blogRoutes(Container));
    router.use('/category', categoryRoutes(Container));
    router.use('/tag', tagRoutes(Container));

    return router;
}