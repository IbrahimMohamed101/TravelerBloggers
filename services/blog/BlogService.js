const logger = require('../../utils/logger');
const { Op } = require('sequelize');
const slugify = require('slugify');
const { UnauthorizedError, NotFoundError, ValidationError, ForbiddenError } = require('../../errors/CustomErrors');
const { withTransaction } = require('../../utils/withTransaction');
const InteractionService = require('./InteractionService');
const sequelize = require('../../config/sequelize');
const { getRolePermissions } = require('../permission/roleService');

class BlogService {
    constructor(db, redisService) {
        this.db = db;
        this.redisService = redisService;
        logger.debug(`redisService methods: ${JSON.stringify(Object.keys(redisService || {}))}`);
        this.Blog = db.blogs;
        this.BlogTag = db.tags;
        this.BlogTagMapping = db.blog_tag_mappings;
        this.BlogCategory = db.categories;
        this.BlogCategoryMapping = db.blog_categories;
        this.interactionService = new InteractionService(db, redisService);
        this.CACHE_TTL = 3600; // 1 hour
    }

    /**
     * Creates a new blog post and invalidates relevant caches
     * @param {string} userId - UUID of the user creating the blog
     * @param {Object} blogData - Blog data (title, content, author, tags, category_ids, etc.)
     * @returns {Promise<Object>} - Created blog
     */
    async createBlog(userId, blogData) {
        try {
            if (!userId) throw new UnauthorizedError('User ID is required');
            this.#validateBlogData(blogData);
            const slug = await this.#generateSlug(blogData.title);

            const blog = await withTransaction(sequelize, async (transaction) => {
                const newBlog = await this.Blog.create(
                    {
                        ...blogData,
                        author_id: userId,
                        slug,
                        category_ids: blogData.category_ids || [],
                        is_public: blogData.is_public ?? true,
                        status: blogData.status || 'draft',
                        published_at: blogData.status === 'published' ? new Date() : null,
                        created_at: new Date()
                    },
                    { transaction }
                );

                if (blogData.tags && Array.isArray(blogData.tags)) {
                    await this.assignTags(newBlog.id, blogData.tags, transaction);
                }

                if (blogData.categories && Array.isArray(blogData.categories)) {
                    await this.assignCategories(newBlog.id, blogData.categories, transaction);
                }

                return newBlog;
            });

            if (this.redisService && this.redisService.enabled) {
                await this.#invalidateCachesForCreate(userId, blog);
            } else {
                logger.warn('Redis service is not available; skipping cache invalidation');
            }

            return blog;
        } catch (error) {
            logger.error(`Error creating blog for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Invalidates caches after blog creation
     * @param {string} userId - UUID of the user
     * @param {Object} blog - Created blog
     */
    async #invalidateCachesForCreate(userId, blog) {
        try {
            if (this.redisService && this.redisService.enabled && typeof this.redisService.del === 'function') {
                // إبطال الـ cache للمدونات الخاصة بالمستخدم
                await this.redisService.del(`blogs:user:${userId}`);
                // إبطال الـ cache لجميع المدونات
                await this.redisService.del('blogs:all');
                // إبطال الـ cache بناءً على العنوان أو المؤلف إذا كانت الدوال متاحة
                if (typeof this.redisService.deletePattern === 'function') {
                    await this.redisService.deletePattern(`blogs:title:*`);
                    // استخدام author_id بدلاً من author لأن author غير معرف
                    await this.redisService.deletePattern(`blogs:author_id:${blog.author_id}`);
                    await this.redisService.deletePattern(`blogs:filter:*`);
                } else {
                    logger.warn('deletePattern is not a function in redisService; skipping pattern deletion');
                }
                logger.info(`Cache invalidated for new blog for user ${userId}`);
            } else {
                logger.warn('Redis service is not available or del method is missing; skipping cache invalidation');
            }
        } catch (error) {
            logger.error(`Error invalidating caches for blog creation: ${error.message}`);
        }
    }

    /**
     * Invalidates caches after blog update
     * @param {string} blogId - UUID of the blog
     * @param {Object} blog - Updated blog
     */
    async #invalidateCachesForUpdate(blogId, blog) {
        try {
            if (this.redisService && this.redisService.enabled && typeof this.redisService.del === 'function') {
                await this.redisService.del(`blog:id:${blogId}`);
                await this.redisService.del(`blog:slug:${blog.slug.toLowerCase()}`);
                await this.redisService.del(`blogs:user:${blog.author_id}`);
                await this.redisService.del('blogs:all');
                if (this.redisService && typeof this.redisService.deletePattern === 'function') {
                    await this.redisService.deletePattern(`blogs:title:*`);
                    await this.redisService.deletePattern(`blogs:author_id:${blog.author_id}`);
                    await this.redisService.deletePattern(`blogs:filter:*`);
                } else {
                    logger.warn('deletePattern is not a function in redisService; skipping pattern deletion');
                }
                logger.info(`Cache invalidated for updated blog ${blogId}`);
            } else {
                logger.warn('Redis service is not available or del method is missing; skipping cache invalidation');
            }
        } catch (error) {
            logger.error(`Error invalidating caches for blog update: ${error.message}`);
        }
    }

    /**
     * Invalidates caches after blog deletion
     * @param {string} blogId - UUID of the blog
     * @param {Object} blog - Deleted blog
     */
    async #invalidateCachesForDelete(blogId, blog) {
        try {
            if (this.redisService && this.redisService.enabled && typeof this.redisService.del === 'function') {
                await this.redisService.del(`blog:id:${blogId}`);
                await this.redisService.del(`blog:slug:${blog.slug.toLowerCase()}`);
                await this.redisService.del(`blogs:user:${blog.author_id}`);
                await this.redisService.del('blogs:all');
                if (this.redisService && typeof this.redisService.deletePattern === 'function') {
                    await this.redisService.deletePattern(`blogs:title:*`);
                    await this.redisService.deletePattern(`blogs:author_id:${blog.author_id}`);
                    await this.redisService.deletePattern(`blogs:filter:*`);
                } else {
                    logger.warn('deletePattern is not a function in redisService; skipping pattern deletion');
                }
                logger.info(`Cache invalidated for deleted blog ${blogId}`);
            } else {
                logger.warn('Redis service is not available or del method is missing; skipping cache invalidation');
            }
        } catch (error) {
            logger.error(`Error invalidating caches for blog deletion: ${error.message}`);
        }
    }

    /**
     * Retrieves a blog by ID or slug with caching
     * @param {Object} params - Parameters
     * @param {string} [params.blogId] - UUID of the blog
     * @param {string} [params.slug] - Slug of the blog
     * @returns {Promise<Object>} - Blog object
     */
    async getBlog({ blogId, slug }) {
        try {
            if (!blogId && !slug) throw new ValidationError('Blog ID or slug is required');
            const cacheKey = blogId ? `blog:id:${blogId}` : `blog:slug:${slug.toLowerCase()}`;

            if (this.redisService && this.redisService.enabled && typeof this.redisService.get === 'function') {
                const cachedBlog = await this.redisService.get(cacheKey);
                if (cachedBlog) {
                    logger.info(`Cache hit for blog ${blogId || slug}`);
                    return cachedBlog;
                }
            }

            const blog = await this.Blog.findOne({
                where: blogId ? { id: blogId } : { slug },
                include: [
                    { model: this.BlogTag, as: 'tags', through: { attributes: [] } },
                    { model: this.BlogCategory, as: 'blogCategories', through: { attributes: [] } },
                    { model: this.db.comments, as: 'comments', paranoid: true }
                ],
                paranoid: true
            });

            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            if (this.redisService && this.redisService.enabled && typeof this.redisService.set === 'function') {
                await this.redisService.set(cacheKey, blog, this.CACHE_TTL);
                if (blogId && slug) {
                    await this.redisService.set(`blog:id:${blogId}`, blog, this.CACHE_TTL);
                    await this.redisService.set(`blog:slug:${slug.toLowerCase()}`, blog, this.CACHE_TTL);
                }
                logger.info(`Cache set for blog ${blogId || slug}`);
            }

            return blog;
        } catch (error) {
            logger.error(`Error fetching blog ${blogId || slug}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Filters blogs with pagination, caching, and tag/category support
     * @param {Object} params - Filter parameters
     * @returns {Promise<Object>} - Paginated results { items, total, page, pageSize }
     */
    async filterBlogs({
        title,
        author_id,
        tags,
        categories,
        status,
        is_public,
        featured,
        dateRange,
        sortBy = 'created_at',
        order = 'DESC',
        page = 1,
        pageSize = 10
    }) {
        try {
            const cacheKey = `blogs:filter:${JSON.stringify({
                title,
                author_id,
                tags,
                categories,
                status,
                is_public,
                featured,
                dateRange,
                sortBy,
                order,
                page,
                pageSize
            })}`;

            if (this.redisService && this.redisService.enabled && typeof this.redisService.get === 'function') {
                const cachedResult = await this.redisService.get(cacheKey);
                if (cachedResult) {
                    logger.info(`Cache hit for blog filter`);
                    return cachedResult;
                }
            }

            const where = {};
            if (title) {
                where.title = { [Op.iLike]: `%${title}%` };
            }
            if (author_id) {
                where.author_id = author_id;
            }
            if (status) {
                where.status = status;
            }
            if (is_public !== undefined) {
                where.is_public = is_public;
            }
            if (featured !== undefined) {
                where.featured = featured;
            }
            if (dateRange) {
                where.published_at = {
                    [Op.between]: [dateRange.start, dateRange.end]
                };
            }

            const include = [];
            if (tags && Array.isArray(tags)) {
                include.push({
                    model: this.BlogTag,
                    as: 'tags',
                    where: { id: { [Op.in]: tags } },
                    through: { attributes: [] }
                });
            }
            if (categories && Array.isArray(categories)) {
                include.push({
                    model: this.BlogCategory,
                    as: 'blogCategories',
                    where: { id: { [Op.in]: categories } },
                    through: { attributes: [] }
                });
            }

            const offset = (page - 1) * pageSize;
            const { rows: items, count: total } = await this.Blog.findAndCountAll({
                where,
                include,
                order: [[sortBy, order]],
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

            if (this.redisService && this.redisService.enabled && typeof this.redisService.set === 'function') {
                await this.redisService.set(cacheKey, result, this.CACHE_TTL / 2);
                logger.info(`Cache set for blog filter`);
            }

            return result;
        } catch (error) {
            logger.error(`Error filtering blogs: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates a blog post with permission and ownership checks
     * @param {string} blogId - UUID of the blog
     * @param {Object} updateData - Blog data to update
     * @param {string} userId - ID of the user
     * @param {string} userRole - Role of the user
     * @returns {Promise<Object>} - Updated blog
     */
    async updateBlog(blogId, updateData, userId, userRole) {
        try {
            this.#validateBlogData(updateData);

            const blog = await this.Blog.findByPk(blogId, { paranoid: true });
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            // Check permissions or ownership
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('edit_blog') || userRole === 'super_admin';
            const isOwner = blog.author_id === userId;

            if (!hasPermission && !isOwner) {
                throw new ForbiddenError(
                    'Editing is not allowed - you are not the blog owner and you do not have permission',
                    'FORBIDDEN'
                );
            }

            const updatedBlog = await withTransaction(this.db.sequelize, async (transaction) => {
                if (updateData.title) {
                    updateData.slug = await this.#generateSlug(updateData.title, blogId);
                }
                if (updateData.status === 'published' && !blog.published_at) {
                    updateData.published_at = new Date();
                }
                await blog.update({ ...updateData, updated_at: new Date() }, { transaction });

                if (updateData.tags && Array.isArray(updateData.tags)) {
                    await this.assignTags(blogId, updateData.tags, transaction);
                }

                if (updateData.categories && Array.isArray(updateData.categories)) {
                    await this.assignCategories(blogId, updateData.categories, transaction);
                }

                return blog;
            });

            if (this.redisService && this.redisService.enabled) {
                await this.#invalidateCachesForUpdate(blogId, updatedBlog);
            } else {
                logger.warn('Redis service is not available; skipping cache invalidation');
            }

            return updatedBlog;
        } catch (error) {
            logger.error(`Error updating blog ${blogId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deletes a blog post (soft delete) with permission and ownership checks
     * @param {string} blogId - UUID of the blog
     * @param {string} userId - ID of the user
     * @param {string} userRole - Role of the user
     * @returns {Promise<boolean>} - True if deleted
     */
    async deleteBlog(blogId, userId, userRole) {
        try {
            const blog = await this.Blog.findByPk(blogId, { paranoid: true });
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            // Check permissions or ownership
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('delete_blog') || userRole === 'super_admin';
            const isOwner = blog.author_id === userId;

            if (!hasPermission && !isOwner) {
                throw new ForbiddenError(
                    'Deletion is not allowed - you are not the blog owner and you do not have permission',
                    'FORBIDDEN'
                );
            }

            await blog.destroy();

            if (this.redisService && this.redisService.enabled) {
                await this.#invalidateCachesForDelete(blogId, blog);
            } else {
                logger.warn('Redis service is not available; skipping cache invalidation');
            }

            return true;
        } catch (error) {
            logger.error(`Error deleting blog ${blogId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Assigns tags to a blog
     * @param {string} blogId - UUID of the blog
     * @param {Array<string>} tagIds - Array of tag UUIDs
     * @param {Object} [transaction] - Sequelize transaction
     * @returns {Promise<boolean>} - True if successful
     */
    async assignTags(blogId, tagIds, transaction = null) {
        try {
            const blog = await this.Blog.findByPk(blogId, { paranoid: true });
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            const tags = await this.BlogTag.findAll({ where: { id: { [Op.in]: tagIds } } });
            if (tags.length !== tagIds.length) {
                throw new ValidationError('One or more tags not found');
            }

            await this.BlogTagMapping.destroy({ where: { blog_id: blogId }, transaction });
            const mappings = tagIds.map((tagId) => ({
                blog_id: blogId,
                tag_id: tagId
            }));
            await this.BlogTagMapping.bulkCreate(mappings, { transaction });

            if (this.redisService && this.redisService.enabled && !transaction && typeof this.redisService.del === 'function') {
                await this.redisService.del(`blog:id:${blogId}`);
                await this.redisService.del(`blog:slug:${blog.slug.toLowerCase()}`);
            }

            return true;
        } catch (error) {
            logger.error(`Error assigning tags to blog ${blogId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Assigns categories to a blog
     * @param {string} blogId - UUID of the blog
     * @param {Array<string>} categoryIds - Array of category UUIDs
     * @param {Object} [transaction] - Sequelize transaction
     * @returns {Promise<boolean>} - True if successful
     */
    async assignCategories(blogId, categoryIds, transaction = null) {
        try {
            const blog = await this.Blog.findByPk(blogId, { paranoid: true });
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            const categories = await this.BlogCategory.findAll({ where: { id: { [Op.in]: categoryIds } } });
            if (categories.length !== categoryIds.length) {
                throw new ValidationError('One or more categories not found');
            }

            await this.BlogCategoryMapping.destroy({ where: { blog_id: blogId }, transaction });
            const mappings = categoryIds.map((categoryId) => ({
                blog_id: blogId,
                category_id: categoryId
            }));
            await this.BlogCategoryMapping.bulkCreate(mappings, { transaction });

            await blog.update({ category_ids: categoryIds }, { transaction });

            if (this.redisService && this.redisService.enabled && !transaction && typeof this.redisService.del === 'function') {
                await this.redisService.del(`blog:id:${blogId}`);
                await this.redisService.del(`blog:slug:${blog.slug.toLowerCase()}`);
            }

            return true;
        } catch (error) {
            logger.error(`Error assigning categories to blog ${blogId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validates blog data before creation or update
     * @param {Object} blogData - Blog data to validate
     */
    #validateBlogData({ title, content }) {
        if (!title || typeof title !== 'string' || title.trim().length < 3) {
            throw new ValidationError('Title is required and must be at least 3 characters long');
        }
        if (!content || typeof content !== 'string' || content.trim().length < 10) {
            throw new ValidationError('Content is required and must be at least 10 characters long');
        }
    }

    /**
     * Generates a unique slug for a blog
     * @param {string} title - Blog title
     * @param {string} [blogId] - Blog UUID for uniqueness
     * @returns {Promise<string>} - Generated slug
     */
    async #generateSlug(title, blogId = null) {
        let slug = slugify(title, { lower: true, strict: true });
        if (blogId) {
            slug = `${slug}-${blogId}`;
        }
        const existingBlog = await this.Blog.findOne({ where: { slug } });
        if (existingBlog && existingBlog.id !== blogId) {
            slug = `${slug}-${Date.now()}`;
        }
        return slug;
    }
}

module.exports = BlogService;