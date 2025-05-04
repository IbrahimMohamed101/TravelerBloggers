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

    /** ---------- RAW Access ---------- */

    async getRaw(key) {
        if (!this.enabled || !this.client) return null;
        try {
            return await this.client.get(key);
        } catch (error) {
            logger.error(`Redis getRaw error for key "${key}":`, error);
            return null;
        }
    }

    async getNumber(key) {
        const value = await this.getRaw(key);
        return parseInt(value, 10) || 0;
    }

    async exists(key) {
        if (!this.enabled || !this.client) return false;
        try {
            return await this.client.exists(key);
        } catch (error) {
            logger.error(`Redis exists error for key "${key}":`, error);
            return false;
        }
    }

    async incr(key) {
        if (!this.enabled || !this.client) return false;
        try {
            await this.client.incr(key);
            return true;
        } catch (error) {
            logger.error(`Redis incr error for key "${key}":`, error);
            return false;
        }
    }

    async expire(key, ttlSeconds) {
        if (!this.enabled || !this.client) return false;
        try {
            await this.client.expire(key, ttlSeconds);
            return true;
        } catch (error) {
            logger.error(`Redis expire error for key "${key}":`, error);
            return false;
        }
    }

    /** ---------- JSON Handling ---------- */

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

    async getWithExpiry(key) {
        if (!this.enabled || !this.client) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Redis getWithExpiry error for key "${key}":`, error);
            return null;
        }
    }

    /** ---------- Key Deletion ---------- */

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

    /** ---------- List Operations ---------- */

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

    async getList(key) {
        if (!this.enabled || !this.client) return [];
        try {
            return await this.client.lRange(key, 0, -1);
        } catch (error) {
            logger.error(`Redis getList error for key "${key}":`, error);
            return [];
        }
    }

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
