const initDB = require('./initDB');
const { initServices } = require('./initServices');
const initControllers = require('./initControllers');
const logger = require('../utils/logger');

class Container {
    constructor() {
        this.services = {};
        this.controllers = {};
        this.middlewares = {};
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const { db, sequelize } = await initDB();
            this.db = db;
            this.sequelize = sequelize;

            this.services = await initServices(db, sequelize, this);
            this.controllers = initControllers(this);

            this.isInitialized = true;
            logger.info('Container initialized successfully');
        } catch (err) {
            logger.error('Container failed to initialize:', err);
            throw err;
        }
    }

    resolve(name) {
        if (this.services[name]) return this.services[name];
        if (this.controllers[name]) return this.controllers[name];
        if (name === 'db') return this.db;
        if (name === 'sequelize') return this.sequelize;
        throw new Error(`Service '${name}' not found in container`);
    }

    getService(name) {
        const service = this.services[name];
        if (!service) throw new Error(`Service '${name}' not found`);
        return service;
    }

    getController(name) {
        const controller = this.controllers[name];
        if (!controller) throw new Error(`Controller '${name}' not found`);
        return controller;
    }

    getDb() {
        if (!this.isInitialized) throw new Error('Container not initialized');
        return this.db;
    }

    getSequelize() {
        if (!this.isInitialized) throw new Error('Container not initialized');
        return this.sequelize;
    }

    getLogger() {
        return logger;
    }

    getMiddleware(name) {
        if (name === 'adminAuth') {
            return authorize;
        }
        throw new Error(`Middleware '${name}' not found`);
    }
}

module.exports = new Container();