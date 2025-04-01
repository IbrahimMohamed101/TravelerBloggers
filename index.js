const { Sequelize } = require('sequelize');
const express = require('express');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const passport = require('passport');
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const logger = require('./utils/logger');
const { required } = require('joi');
require('dotenv').config();

const app = express();

app.use(express.json());

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

app.use('/users', authRoutes);

app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.stack}`);
    res.status(500).json({ message: 'Something went wrong!' });
});

// تهيئة Sequelize
db.sequelize.sync({ force: false })
    .then(() => {
        logger.info('Database synced successfully');
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error(`Error syncing database: ${err.message}`);
    });