const CategoryService = require('../../services/blog/CategoryService');
const { ValidationError } = require('../../errors/CustomErrors');

class CategoryController {
    constructor(db, redisService) {
        this.categoryService = new CategoryService(db, redisService);
    }

    async createCategory(req, res, next) {
        try {
            if (!req.user || !req.user.role) {
                throw new ValidationError('User role is required');
            }

            const categoryData = req.body;
            if (!categoryData || !categoryData.name) {
                throw new ValidationError('Category name is required');
            }

            const userRole = req.user.role;
            const category = await this.categoryService.createCategory(categoryData, userRole);
            res.status(201).json(category);
        } catch (error) {
            next(error);
        }
    }

    async getCategory(req, res) {
        try {
            const { categoryIdOrSlug } = req.params;
            const category = await this.categoryService.getCategory({
                categoryId: categoryIdOrSlug,
                slug: categoryIdOrSlug
            });
            res.status(200).json(category);
        } catch (error) {
            throw error;
        }
    }

    async getAllCategories(req, res) {
        try {
            const { page, pageSize } = req.query;
            const categories = await this.categoryService.getAllCategories({ page, pageSize });
            res.status(200).json(categories);
        } catch (error) {
            throw error;
        }
    }

    async updateCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const updateData = req.body;
            const userRole = req.user.role;
            const updatedCategory = await this.categoryService.updateCategory(categoryId, updateData, userRole);
            res.status(200).json(updatedCategory);
        } catch (error) {
            throw error;
        }
    }

    async deleteCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const userRole = req.user.role;
            const deleted = await this.categoryService.deleteCategory(categoryId, userRole);
            res.status(204).send();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CategoryController;