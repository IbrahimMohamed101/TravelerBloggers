const initDB = require('./initDB');
const { initServices } = require('./initServices');
const initControllers = require('./initControllers');
const logger = require('../utils/logger');

class Container {
    constructor() {
        this.services = {};
        this.controllers = {};
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const { db, sequelize } = await initDB();
            this.db = db;

            this.services = await initServices(db, sequelize);
            this.controllers = initControllers(this.services);

            this.isInitialized = true;
            logger.info('Container initialized successfully');
        } catch (err) {
            logger.error('Container failed to initialize:', err);
            throw err;
        }
    }

    getService(name) {
        if (!this.isInitialized) throw new Error('Container not initialized');
        const service = this.services[name];
        if (!service) throw new Error(`Service '${name}' not found`);
        return service;
    }

    getController(name) {
        if (!this.isInitialized) throw new Error('Container not initialized');
        const controller = this.controllers[name];
        if (!controller) throw new Error(`Controller '${name}' not found`);
        return controller;
    }
}

module.exports = new Container();
