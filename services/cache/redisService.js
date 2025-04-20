const redis = require('redis');
const logger = require('../../utils/logger');

class RedisService {
    constructor(config = {}) {
        this.enabled = false;
        this.client = null;
        this.initialize(config);
    }

    async initialize(config = {}) {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        
        if (process.env.USE_REDIS !== 'false') {
            try {
                this.client = redis.createClient({
                    url,
                    socket: {
                        reconnectStrategy: (retries) => {
                            if (retries > 5) {
                                logger.warn('Max Redis reconnection attempts reached - disabling Redis');
                                this.enabled = false;
                                return new Error('Max retries reached');
                            }
                            return Math.min(retries * 100, 5000);
                        }
                    },
                    ...config
                });

                this.client.on('error', (err) => {
                    logger.warn('Redis connection error:', err.message);
                    this.enabled = false;
                });

                this.client.on('connect', () => {
                    logger.info('Redis client connected');
                    this.enabled = true;
                });

                this.client.on('ready', () => {
                    logger.info('Redis client ready');
                    this.enabled = true;
                });

                await this.client.connect();
            } catch (error) {
                logger.error('Redis initialization error:', error);
                this.enabled = false;
            }
        }
    }

    async setWithExpiry(key, value, ttlSeconds) {
        if (!this.enabled || !this.client) return false;
        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: ttlSeconds
            });
            return true;
        } catch (error) {
            logger.error('Redis set error:', error);
            return false;
        }
    }

    async getWithExpiry(key) {
        if (!this.enabled || !this.client) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Redis get error:', error);
            return null;
        }
    }

    async deleteKey(key) {
        if (!this.enabled || !this.client) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Redis delete error:', error);
            return false;
        }
    }
}

module.exports = RedisService;
