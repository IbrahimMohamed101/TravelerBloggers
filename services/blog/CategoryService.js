const logger = require('../../utils/logger');
const { Op } = require('sequelize');
const slugify = require('slugify');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../errors/CustomErrors');
const { withTransaction } = require('../../utils/withTransaction');
const { getRolePermissions } = require('../../services/permission/roleService');

class CategoryService {
    constructor(db, redisService) {
        this.db = db;
        this.redisService = redisService;
        this.Category = db.categories;
        this.BlogCategoryMapping = db.blog_categories;
        this.CACHE_TTL = 3600; // 1 hour
    } 

    /**
     * Creates a new category with permission check
     * @param {Object} categoryData - Category data (name, description)
     * @param {string} userRole - Role of the user
     * @returns {Promise<Object>} - Created category
     */
    async createCategory(categoryData, userRole) {
        try {
            // Check permissions
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('manage_categories') || userRole === 'super_admin';
            if (!hasPermission) {
                throw new ForbiddenError('Not allowed to create category - insufficient permissions', 'FORBIDDEN');
            }

            this.#validateCategoryData(categoryData);
            const slug = await this.#generateSlug(categoryData.name);

            const category = await withTransaction(this.db.sequelize, async (transaction) => {
                return await this.Category.create(
                    {
                        ...categoryData,
                        slug,
                        created_at: new Date(),
                        updated_at: new Date()
                    },
                    { transaction }
                );
            });

            if (this.redisService.enabled) {
                await this.redisService.set(`category:id:${category.id}`, category, this.CACHE_TTL);
                await this.redisService.del('categories:all');
                logger.info(`Cache updated for new category ${category.id}`);
            }

            return category;
        } catch (error) {
            logger.error(`Error creating category: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves a category by ID or slug
     * @param {Object} params - Parameters
     * @param {string} [params.categoryId] - UUID of the category
     * @param {string} [params.slug] - Slug of the category
     * @returns {Promise<Object>} - Category object
     */
    async getCategory({ categoryId, slug }) {
        try {
            if (!categoryId && !slug) throw new ValidationError('Category ID or slug is required');
            const cacheKey = categoryId ? `category:id:${categoryId}` : `category:slug:${slug.toLowerCase()}`;

            if (this.redisService.enabled) {
                const cachedCategory = await this.redisService.get(cacheKey);
                if (cachedCategory) {
                    logger.info(`Cache hit for category ${categoryId || slug}`);
                    return cachedCategory;
                }
            }

            const category = await this.Category.findOne({
                where: categoryId ? { id: categoryId } : { slug },
                paranoid: true
            });

            if (!category) {
                throw new NotFoundError('Category not found');
            }

            if (this.redisService.enabled) {
                await this.redisService.set(cacheKey, category, this.CACHE_TTL);
                logger.info(`Cache set for category ${categoryId || slug}`);
            }

            return category;
        } catch (error) {
            logger.error(`Error fetching category ${categoryId || slug}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves all categories with pagination
     * @param {Object} params - Parameters
     * @param {number} [params.page=1] - Page number
     * @param {number} [params.pageSize=10] - Items per page
     * @returns {Promise<Object>} - Paginated categories
     */
    async getAllCategories({ page = 1, pageSize = 10 }) {
        try {
            const cacheKey = `categories:all:page:${page}:size:${pageSize}`;

            if (this.redisService.enabled) {
                const cachedCategories = await this.redisService.get(cacheKey);
                if (cachedCategories) {
                    logger.info(`Cache hit for all categories`);
                    return cachedCategories;
                }
            }

            const offset = (page - 1) * pageSize;
            const { rows: items, count: total } = await this.Category.findAndCountAll({
                order: [['created_at', 'DESC']],
                limit: pageSize,
                offset,
                paranoid: true
            });

            const result = {
                items,
                total,
                page: Number(page),
                pageSize: Number(pageSize)
            };

            if (this.redisService.enabled) {
                await this.redisService.set(cacheKey, result, this.CACHE_TTL / 2);
                logger.info(`Cache set for all categories`);
            }

            return result;
        } catch (error) {
            logger.error(`Error fetching all categories: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates a category with permission check
     * @param {string} categoryId - UUID of the category
     * @param {Object} updateData - Data to update
     * @param {string} userRole - Role of the user
     * @returns {Promise<Object>} - Updated category
     */
    async updateCategory(categoryId, updateData, userRole) {
        try {
            // Check permissions
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('manage_categories') || userRole === 'super_admin';
            if (!hasPermission) {
                throw new ForbiddenError('Not allowed to update category - insufficient permissions', 'FORBIDDEN');
            }

            this.#validateCategoryData(updateData);

            const category = await this.Category.findByPk(categoryId, { paranoid: true });
            if (!category) {
                throw new NotFoundError('Category not found');
            }

            const updatedCategory = await withTransaction(this.db.sequelize, async (transaction) => {
                if (updateData.name) {
                    updateData.slug = await this.#generateSlug(updateData.name, categoryId);
                }
                await category.update(
                    { ...updateData, updated_at: new Date() },
                    { transaction }
                );
                return category;
            });

            if (this.redisService.enabled) {
                await this.redisService.del(`category:id:${categoryId}`);
                await this.redisService.del(`category:slug:${category.slug.toLowerCase()}`);
                await this.redisService.del('categories:all');
                logger.info(`Cache cleared for updated category ${categoryId}`);
            }

            return updatedCategory;
        } catch (error) {
            logger.error(`Error updating category ${categoryId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deletes a category (soft delete) with permission check
     * @param {string} categoryId - UUID of the category
     * @param {string} userRole - Role of the user
     * @returns {Promise<boolean>} - True if deleted
     */
    async deleteCategory(categoryId, userRole) {
        try {
            // Check permissions
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('manage_categories') || userRole === 'super_admin';
            if (!hasPermission) {
                throw new ForbiddenError('Not allowed to delete category - insufficient permissions', 'FORBIDDEN');
            }

            const category = await this.Category.findByPk(categoryId, { paranoid: true });
            if (!category) {
                throw new NotFoundError('Category not found');
            }

            await withTransaction(this.db.sequelize, async (transaction) => {
                await this.BlogCategoryMapping.destroy({ where: { category_id: categoryId }, transaction });
                await category.destroy({ transaction });
            });

            if (this.redisService.enabled) {
                await this.redisService.del(`category:id:${categoryId}`);
                await this.redisService.del(`category:slug:${category.slug.toLowerCase()}`);
                await this.redisService.del('categories:all');
                logger.info(`Cache cleared for deleted category ${categoryId}`);
            }

            return true;
        } catch (error) {
            logger.error(`Error deleting category ${categoryId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validates category data
     * @param {Object} categoryData - Category data to validate
     */
    #validateCategoryData({ name }) {
        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            throw new ValidationError('Name is required and must be at least 3 characters long');
        }
    }

    /**
     * Generates a unique slug for a category
     * @param {string} name - Category name
     * @param {string} [categoryId] - Category UUID for uniqueness
     * @returns {Promise<string>} - Generated slug
     */
    async #generateSlug(name, categoryId = null) {
        let slug = slugify(name, { lower: true, strict: true });
        if (categoryId) {
            slug = `${slug}-${categoryId}`;
        }
        const existingCategory = await this.Category.findOne({ where: { slug } });
        if (existingCategory && existingCategory.id !== categoryId) {
            slug = `${slug}-${Date.now()}`;
        }
        return slug;
    }
}

module.exports = CategoryService;