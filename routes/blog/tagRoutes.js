const express = require('express');
const { check } = require('express-validator');
const TagController = require('../controllers/TagController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

module.exports = (db, redisService) => {
    const tagController = new TagController(db, redisService);

    router.post(
        '/',
        authMiddleware,
        [
            check('name').isString().isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
        ],
        tagController.createTag.bind(tagController)
    );

    router.get(
        '/:tagIdOrSlug',
        tagController.getTag.bind(tagController)
    );

    router.get(
        '/',
        [
            check('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
            check('pageSize').optional().isInt({ min: 1 }).withMessage('PageSize must be a positive integer')
        ],
        tagController.getAllTags.bind(tagController)
    );

    router.put(
        '/:tagId',
        authMiddleware,
        [
            check('name').optional().isString().isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
        ],
        tagController.updateTag.bind(tagController)
    );

    router.delete(
        '/:tagId',
        authMiddleware,
        tagController.deleteTag.bind(tagController)
    );

    return router;
};