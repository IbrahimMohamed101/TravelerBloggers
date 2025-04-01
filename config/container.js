const AuthService = require('../services/authService');
const AuthController = require('../controllers/authController');

class Container {
    constructor() {
        this.services = {};
        this.controllers = {};
        this.initialize();
    }

    initialize() {
        this.services.authService = new AuthService();
        this.controllers.authController = new AuthController(this.services.authService);
    }

    getService(name) {
        return this.services[name];
    }

    getController(name) {
        return this.controllers[name];
    }
}

module.exports = new Container(); 
