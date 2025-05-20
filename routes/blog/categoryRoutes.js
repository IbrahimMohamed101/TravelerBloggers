const express = require('express');
const { check } = require('express-validator');
const CategoryController = require('../../controllers/blog/CategoryController');
const verifyJWT = require('../../middlewares/verifyJWT');
const validateRequest = require('../../middlewares/validateRequest');

const router = express.Router();

module.exports = (db, redisService) => {
    const categoryController = new CategoryController(db, redisService);

    router.post(
        '/',
        verifyJWT(),
        [
            check('name').notEmpty().withMessage('Name is required')
                .isString().withMessage('Name must be a string')
                .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
        ],
        validateRequest,
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
        verifyJWT(),
        [
            check('name').optional().isString().isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
        ],
        categoryController.updateCategory.bind(categoryController)
    );

    router.delete(
        '/:categoryId',
        verifyJWT(),
        categoryController.deleteCategory.bind(categoryController)
    );

    return router;
};