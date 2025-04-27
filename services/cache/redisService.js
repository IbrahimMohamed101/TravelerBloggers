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
                                logger.warn('Max Redis reconnection attempts reached – disabling Redis');
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
                    this.enabled = true;
                });

                this.client.on('ready', () => {
                    logger.info('Redis client ready');
                    this.enabled = true;
                });

                await this.client.connect();
                logger.info('Redis connected');
            } catch (error) {
                logger.error('Redis initialization failed:', error);
                this.enabled = false;
            }
        } else {
            logger.info('Redis is disabled by USE_REDIS environment variable');
        }
    }

    // Set a key with TTL
    async setWithExpiry(key, value, ttlSeconds) {
        if (!this.enabled || !this.client) return false;
        try {
            const result = await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
            return result === 'OK';
        } catch (error) {
            logger.error(`Redis set error for key "${key}":`, error);
            return false;
        }
    }

    // Get a key and parse JSON
    async getWithExpiry(key) {
        if (!this.enabled || !this.client) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Redis get error for key "${key}":`, error);
            return null;
        }
    }

    // Delete a specific key
    async deleteKey(key) {
        if (!this.enabled || !this.client) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error(`Redis delete error for key "${key}":`, error);
            return false;
        }
    }

    // Delete all keys matching a pattern
    async deletePattern(pattern) {
        if (!this.enabled || !this.client) return false;
        try {
            const keys = [];
            for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
                keys.push(key);
                if (keys.length >= 100) break;
            }
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            logger.error(`Redis deletePattern error for pattern "${pattern}":`, error);
            return false;
        }
    }

    // Add item to list (e.g. for user sessions)
    async addToList(key, value, ttlSeconds = null) {
        if (!this.enabled || !this.client) return false;
        try {
            await this.client.rPush(key, value);
            if (ttlSeconds) await this.client.expire(key, ttlSeconds);
            return true;
        } catch (error) {
            logger.error(`Redis addToList error for key "${key}":`, error);
            return false;
        }
    }

    // Get list of items
    async getList(key) {
        if (!this.enabled || !this.client) return [];
        try {
            return await this.client.lRange(key, 0, -1);
        } catch (error) {
            logger.error(`Redis getList error for key "${key}":`, error);
            return [];
        }
    }

    // Remove item from list
    async removeFromList(key, value) {
        if (!this.enabled || !this.client) return false;
        try {
            await this.client.lRem(key, 0, value);
            return true;
        } catch (error) {
            logger.error(`Redis removeFromList error for key "${key}":`, error);
            return false;
        }
    }
}

module.exports = RedisService;
