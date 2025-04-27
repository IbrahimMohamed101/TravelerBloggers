const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const passwordRoutes = require('./passwordRoutes');



module.exports = (container) => {
    router.use(userRoutes(container));
    router.use(passwordRoutes(container));

    return router;
}