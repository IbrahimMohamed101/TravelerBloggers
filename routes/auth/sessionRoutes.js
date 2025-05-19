const express = require('express');
const verifyJWT = require('../../middlewares/verifyJWT');
const router = express.Router();

module.exports = (container) => {
    const sessionController = container.getController('sessionController');

    router.post('/logout', verifyJWT(), sessionController.logout.bind(sessionController));
    router.get('/sessions', verifyJWT(), sessionController.getSessions.bind(sessionController));
    router.post('/logout-all', verifyJWT(), sessionController.logoutAll.bind(sessionController));


    return router;
};
