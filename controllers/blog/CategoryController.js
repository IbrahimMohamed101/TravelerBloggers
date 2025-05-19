class CategoryController {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }

    async createCategory(req, res) {
        try {
            const categoryData = req.body;
            const userRole = req.user.role;
            const category = await this.categoryService.createCategory(categoryData, userRole);
            res.status(201).json(category);
        } catch (error) {
            throw error;
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