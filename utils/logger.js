const winston = require('winston');

const logger = winston.createLogger({
    level: 'debug', // لكل التفاصيل
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() }), // للـ Terminal
    ],
});

// اختبار الـ Logger
logger.debug('Logger initialized');

module.exports = logger;