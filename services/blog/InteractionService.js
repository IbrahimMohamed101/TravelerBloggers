const logger = require('../../utils/logger');
const { NotFoundError, ValidationError, UnauthorizedError } = require('../../errors/CustomErrors');
const { withTransaction } = require('../../utils/withTransaction');
const { getRolePermissions } = require('../../services/permission/roleService');

class InteractionService {
    constructor(db, redisService) {
        this.db = db;
        this.redisService = redisService;
        this.Blog = db.blogs;
        this.Comment = db.comments;
        this.BlogReaction = db.blog_reactions;
        this.CACHE_TTL = 3600; // 1 hour
    }

    /**
     * Adds a comment to a blog
     * @param {string} blogId - UUID of the blog
     * @param {string} userId - UUID of the user
     * @param {string} content - Comment content
     * @returns {Promise<Object>} - Created comment
     */
    async addComment(blogId, userId, content) {
        try {
            if (!content || typeof content !== 'string' || content.trim().length < 3) {
                throw new ValidationError('Comment content is required and must be at least 3 characters long');
            }

            const blog = await this.Blog.findByPk(blogId, { paranoid: true });
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            // Check permissions
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('create_blog') || userRole === 'super_admin';
            if (!hasPermission) {
                throw new ForbiddenError('FORBIDDEN');
            }
            const comment = await withTransaction(this.db.sequelize, async (transaction) => {
                return await this.Comment.create(
                    {
                        id: require('uuid').v4(),
                        blog_id: blogId,
                        user_id: userId,
                        content,
                        created_at: new Date(),
                        updated_at: new Date()
                    },
                    { transaction }
                );
            });

            if (this.redisService.enabled) {
                await this.redisService.deletePattern(`comments:blog:${blogId}:*`);
            }

            return comment;
        } catch (error) {
            logger.error(`Error adding comment to blog ${blogId} by user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves comments for a blog with pagination
     * @param {string} blogId - UUID of the blog
     * @param {Object} params - Pagination parameters
     * @returns {Promise<Object>} - Paginated comments
     */
    async getComments(blogId, { page = 1, pageSize = 10 }) {
        try {
            const cacheKey = `comments:blog:${blogId}:page:${page}:size:${pageSize}`;

            if (this.redisService.enabled) {
                const cachedComments = await this.redisService.get(cacheKey);
                if (cachedComments) {
                    logger.info(`Cache hit for comments of blog ${blogId}`);
                    return cachedComments;
                }
            }

            const blog = await this.Blog.findByPk(blogId, { paranoid: true });
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }

            const offset = (page - 1) * pageSize;
            const { rows: items, count: total } = await this.Comment.findAndCountAll({
                where: { blog_id: blogId },
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
                logger.info(`Cache set for comments of blog ${blogId}`);
            }

            return result;
        } catch (error) {
            logger.error(`Error fetching comments for blog ${blogId}: ${error.message}`);
            throw error;
        }
    }

    /**
         * Deletes a comment (soft delete) with permission and ownership checks
         * @param {string} commentId - UUID of the comment
         * @param {string} userId - UUID of the user
         * @param {string} userRole - Role of the user
         * @returns {Promise<boolean>} - True if deleted
         */
    async deleteComment(commentId, userId, userRole) {
        try {
            const comment = await this.Comment.findByPk(commentId, { paranoid: true });
            if (!comment) {
                throw new NotFoundError('COMMENT_NOT_FOUND');
            }

            // Check permissions or ownership
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('moderate_content') || userRole === 'super_admin';
            const isOwner = comment.user_id === userId;

            if (!hasPermission && !isOwner) {
                throw new ForbiddenError(
                    'FORBIDDEN'
                );
            }

            await comment.destroy();

            if (this.redisService.enabled) {
                await this.redisService.deletePattern(`comments:blog:${comment.blog_id}:*`);
                logger.info(`Cache cleared for comments of blog ${comment.blog_id}`);
            }
            return true;
        } catch (error) {
            logger.error(`Error deleting comment ${commentId} by user ${userId}: ${error.message}`); throw error;
        }
    }

    /**
     * Toggles a reaction for a blog
     * @param {string} blogId - UUID of the blog
     * @param {string} userId - UUID of the user
     * @param {string} reactionType - Type of reaction (like, love, wow, sad, angry)
     * @returns {Promise<Object>} - Updated blog
     */
    async toggleReaction(blogId, userId, reactionType) {
        try {
            const validReactions = ['like', 'love', 'wow', 'sad', 'angry'];
            if (!validReactions.includes(reactionType)) {
                throw new ValidationError(`Invalid reaction type. Must be one of: ${validReactions.join(', ')}`);
            }

            // Check permissions
            const userPermissions = await getRolePermissions(userRole, this.redisService);
            const hasPermission = userPermissions.includes('create_blog') || userRole === 'super_admin';
            if (!hasPermission) {
                throw new ForbiddenError('FORBIDDEN');
            }

            const cacheKey = `blog:id:${blogId}`;
            return await withTransaction(this.db.sequelize, async (transaction) => {
                const blog = await this.Blog.findByPk(blogId, { paranoid: true, transaction });
                if (!blog) {
                    throw new NotFoundError('Blog not found');
                }

                const user = await this.db.users.findByPk(userId, { transaction });
                if (!user || !user.is_active) {
                    throw new UnauthorizedError('User is not authorized to react to this blog');
                }

                const existingReaction = await this.BlogReaction.findOne({
                    where: { blog_id: blogId, user_id: userId, reaction_type: reactionType },
                    transaction
                });

                if (existingReaction) {
                    await existingReaction.destroy({ transaction });
                } else {
                    await this.BlogReaction.create(
                        {
                            id: require('uuid').v4(),
                            blog_id: blogId,
                            user_id: userId,
                            reaction_type: reactionType,
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        { transaction }
                    );
                }

                if (this.redisService.enabled) {
                    const cachedBlog = await this.redisService.get(cacheKey);
                    if (cachedBlog) {
                        cachedBlog.reactions = cachedBlog.reactions || {};
                        cachedBlog.reactions[reactionType] = (cachedBlog.reactions[reactionType] || 0) + (existingReaction ? -1 : 1);
                        await this.redisService.set(cacheKey, cachedBlog, this.CACHE_TTL);
                        logger.info(`Updated cache for blog ${blogId} reaction: ${reactionType}`);
                    } else {
                        await this.redisService.del(`blog:id:${blogId}`);
                        await this.redisService.del(`blog:slug:${blog.slug.toLowerCase()}`);
                    }
                }

                const reactionCounts = await this.BlogReaction.count({
                    where: { blog_id: blogId },
                    group: ['reaction_type'],
                    transaction
                });
                blog.reactions = reactionCounts.reduce((acc, count) => {
                    acc[count.reaction_type] = count.count;
                    return acc;
                }, {});
                return blog;
            });
        } catch (error) {
            logger.error(`Error toggling reaction ${reactionType} for blog ${blogId} by user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Increments the view count for a blog
     * @param {string} blogId - UUID of the blog
     * @returns {Promise<Object>} - Updated blog
     */
    async incrementViews(blogId) {
        try {
            const cacheKey = `blog:id:${blogId}`;
            return await withTransaction(this.db.sequelize, async (transaction) => {
                const blog = await this.Blog.findByPk(blogId, { paranoid: true, transaction });
                if (!blog) {
                    throw new NotFoundError('Blog not found');
                }

                await blog.increment('views', { transaction });

                if (this.redisService.enabled) {
                    const cachedBlog = await this.redisService.get(cacheKey);
                    if (cachedBlog) {
                        cachedBlog.views = (cachedBlog.views || 0) + 1;
                        await this.redisService.set(cacheKey, cachedBlog, this.CACHE_TTL);
                        logger.info(`Updated cache for blog ${blogId} views`);
                    } else {
                        await this.redisService.del(`blog:id:${blogId}`);
                        await this.redisService.del(`blog:slug:${blog.slug.toLowerCase()}`);
                    }
                }

                return blog;
            });
        } catch (error) {
            logger.error(`Error incrementing views for blog ${blogId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = InteractionService;