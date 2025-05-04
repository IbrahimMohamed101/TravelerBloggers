const logger = require('../../utils/logger');
const { UnauthorizedError, NotFoundError, ValidationError } = require('../../errors/CustomErrors');
const slugify = require('slugify');
const { Op, Transaction } = require('sequelize');
const { withTransaction } = require('../../utils/withTransaction.JS');

class BlogService {
    constructor(db, redisService) {
        this.db = db;
        this.redisService = redisService;
        this.Blog = db.blogs;
        this.BlogTag = db.tags;
        this.BlogTagMapping = db.blog_tag_mappings;
        this.BlogCategory = db.categories;
        this.BlogCategoryMapping = db.blog_categories;
        this.Comment = db.comments;
        this.BlogReaction = db.blog_reactions;
        this.CACHE_TTL = 3600; // Cache TTL in seconds (1 hour)

    }



    #user_Not_found({ userId }) {
        return !userId
    }

    async createBlog(userId, blogData) {
        try {
            if (user_Not_found) throw new UnauthorizedError('User ID is required');

            this.#validateBlogData(blogData);
            const slug = await this.#generateSlug(blogData.title);

            const blog = await withTransaction(this.db.sequelize, async (transaction) => {
                const newBlog = await this.Blog.create(
                    {
                        ...blogData,
                        author_id: userId,
                        slug,
                        category_ids: blogData.category_ids || [],
                        is_public: blogData.is_public ?? true,
                        status: blogData.status || 'draft',
                        published_at: blogData.status === 'published' ? new Date() : null,
                        created_at: new Date(),
                    },
                    { transaction }
                );

                // Assign tags if provided
                if (blogData.tags && Array.isArray(blogData.tags)) {
                    await this.assignTags(newBlog.id, blogData.tags, transaction);
                }

                // Assign categories via blog_categories if provided
                if (blogData.categories && Array.isArray(blogData.categories)) {
                    await this.assignCategories(newBlog.id, blogData.categories, transaction);
                }
                return newBlog;
            });

            // Invalidate caches
            if (this.redisService.enabled) {
                await this.redisService.del(`blogs:user:${userId}`);
                await this.redisService.del('blogs:all');
                await this.redisService.deletePattern(`blogs:title:*`);
                await this.redisService.deletePattern(`blogs:author:${blogData.author.toLowerCase()}`);
                await this.redisService.deletePattern(`blogs:filter:*`);
            }

            return blog;

        } catch (error) {
            logger.error(`Error creating blog for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getBlog({ blogId, slug }) {
        try {
            if (!blogId && !sulg) throw new ValidationError('Blog ID or slug is required');

            const cacheKey = blogId ? `blog:id:${blogId}` : `blog:slug:${slug.toLowerCase()}`;

            //check cache
            if (this.redisService.enabled) {
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
                    { model: this.Comment, as: 'comments', paranoid: true },
                ],
                paranoid: true,
            });

            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            // Cache the result 
            if (this.redisService.enabled) {
                await this.redisService.set(cacheKey, blog, this.CACHE_TTL);
                if (blogId && slug) {
                    await this.redisService.set(`blog:id:${blogId}`, blog.this.CACHE_TTL);
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

    async fillterBlogs({
        title,
        author,
        tags,
        categories,
        status,
        is_public,
        featured,
        deteRange,
        sortBy = 'create_at',
        order = 'DESC',
        page = 1,
        pageSize = 10
    }) {
        try {
            const cacheKey = `blogs:filter:${JSON.stringify({
                title,
                author,
                tags,
                categories,
                status,
                is_public,
                featured,
                deteRange,
                sortBy,
                order,
                page,
                pageSize,
            })}`;

            // Check cache
            if (this.redisService.enabled) {
                const cacheResult = await this.redisService.get(cacheKey);
                if (cacheResult) {
                    logger.info(`Cache hit for blog filter`);
                    return cacheResult;
                }
            }

            const where = {};
            if (title) {
                where.title = { [Op.iLike]: `%${title}%` };
            }
            if (author) {
                where.author = { [Op.iLike]: `%${author}%` };
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
            if (deteRange) {
                where.published_at = {
                    [Op.between]: [deteRange.start, deteRange.end],
                };
            }

            const include = [];
            if (tage && Array.isArray(tags)) {
                include.push({
                    model: this.BlogTag,
                    as: 'tags',
                    where: { id: { [Op.in]: tags } },
                    through: { attributes: [] },
                });
            }
            if (categories && Array.isArray(categories)) {
                include.push({
                    model: this.BlogCategory,
                    as: `blogCategories`,
                    where: { id: { [Op.in]: categories } },
                    through: { attributes: [] },
                });
            }

            const offset = (page - 1) * pageSize;
            const { rows: items, count: total } = await this.Blog.findAndCountAll({
                where,
                include,
                order: [[sortBy, order]],
                limit: pageSize,
                offset,
                paranoid: true,
            });

            const result = {
                items,
                total,
                page: Number(page),
                pageSize: Number(pageSize),
            };

            // Cach the result 
            if (this.redisService.enabled) {
                await this.redisService.set(cacheKey, result, this.CACHE_TTL / 2);
                logger.info(`Cache set for blog filter`);
            }

            return result;
        } catch (error) {
            logger.error(`Error filtering blogs: ${error.message}`);
            throw error;
        }
    }

    async updateBlog(blogId, updateData) {
        try {
            this.#validateBlogData(updateData);
            const blog = await this.#generateSlug(updateData.title, blogId);
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            const updatedBlog = await withTransaction(this.db.sequelize, async (transaction) => {
                if (updateData.title) {
                    updateData.slug = await this.#generateSlug(updateData.title, blog);
                }
                if (updateData.status === 'published' && !blog.published_at) {
                    updateData.published_at = new Date();
                }
                await blog.update({ ...updateData, update_at: new Data() }, { transaction });

                // Update tags if provided
                if (updateData.tags && Array.isArray(updateData.tags)) {
                    await this.assignTags(blogId, updateData.tags, transaction);
                }

                // Update categories if provided
                if (updateData.categories && Array.isArray(updateData.categories)) {
                    await this.assignCategories(blogId, updateData.categories, transaction);
                }

                return blog;
            });

            // Invalidate caches
            if (this.redisService.enabled) {
                await this.redisService.del(`blog:id:${blogId}`);
                await this.redisService.del(`blog:slug:${blog.slug.toLowerCase()}`);
                await this.redisService.del(`blogs:user:${blog.author_id}`);
                await this.redisService.del('blogs:all');
                await this.redisService.deletePattern(`blogs:title:*`);
                await this.redisService.deletePattern(`blogs:author:${(updateData.author || blog.author).toLowerCase()}`);
                await this.redisService.deletePattern(`blogs:filter:*`);
            }
            return updatedBlog;

        } catch (error) {
            logger.error(`Error updating blog ${blogId}: ${error.message}`);
            throw error;
        }


    }

    /**
    * Validates blog data before creation or update
    * @param {Object} blogData - Blog data to validate
    * @throws {ValidationError} - If validation fails
    */

    #validateBlogData({ title, content, author }) {
        if (!title || typeof title !== 'string' || title.trim().length < 3) {
            throw new ValidationError('Title is required and must be at least 3 characters long');
        }
        if (!content || typeof content !== 'string' || content.trim().length < 10) {
            throw new ValidationError('Content is required and must be at least 10 characters long');
        }
        if (!author || typeof author !== 'string') {
            throw new ValidationError('Author is required and must be a valid string');
        }
    }

    /**
  * Generates a unique slug for a blog
  * @param {string} title - Blog title
  * @param {string} [blogId] - Blog UUID for uniqueness
  * @returns {string} - Generated slug
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

    /**
     * Invalidataes cache after blog creation
     * @param {string} userId - UUID of the user
     * @param {Object} blog - Created blog
     */
    async #invalidateCachesForCreate(userId, blog) {
        await this.redisService.del(`blogs:user:${userId}`);
        await this.redisService.del('blogs:all');
        await this.redisService.deletePattern(`blogs:title:*`);

    }


}



module.exports = BlogService;