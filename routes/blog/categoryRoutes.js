const express = require('express');
const { check } = require('express-validator');
const CategoryController = require('../controllers/CategoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

module.exports = (db, redisService) => {
    const categoryController = new CategoryController(db, redisService);

    router.post(
        '/',
        authMiddleware,
        [
            check('name').isString().isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
        ],
        categoryController.createCategory.bind(categoryController)
    );

    router.get(
        '/:categoryIdOrSlug',
        categoryController.getCategory.bind(categoryController)
    );

    router.get(
        '/',
        [
            check('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
            check('pageSize').optional().isInt({ min: 1 }).withMessage('PageSize must be a positive integer')
        ],
        categoryController.getAllCategories.bind(categoryController)
    );

    router.put(
        '/:categoryId',
        authMiddleware,
        [
            check('name').optional().isString().isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
        ],
        categoryController.updateCategory.bind(categoryController)
    );

    router.delete(
        '/:categoryId',
        authMiddleware,
        categoryController.deleteCategory.bind(categoryController)
    );

    return router;
};