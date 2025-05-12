const logger = require('../../utils/logger');
const { Op } = require('sequelize');
const slugify = require('slugify');
const { NotFoundError, ValidationError } = require('../../errors/CustomErrors');
const { withTransaction } = require('../../utils/withTransaction');

class TagService {
    constructor(db, redisService) {
        this.db = db;
        this.redisService = redisService;
        this.Tag = db.tags;
        this.BlogTagMapping = db.blog_tag_mappings;
        this.CACHE_TTL = 3600; // 1 hour
    }

    /**
     * Creates a new tag
     * @param {Object} tagData - Tag data (name)
     * @returns {Promise<Object>} - Created tag
     */
    async createTag(tagData) {
        try {
            this.#validateTagData(tagData);
            const slug = await this.#generateSlug(tagData.name);

            const tag = await withTransaction(this.db.sequelize, async (transaction) => {
                return await this.Tag.create(
                    {
                        ...tagData,
                        slug,
                        created_at: new Date(),
                        updated_at: new Date()
                    },
                    { transaction }
                );
            });

            if (this.redisService.enabled) {
                await this.redisService.set(`tag:id:${tag.id}`, tag, this.CACHE_TTL);
                await this.redisService.del('tags:all');
            }

            return tag;
        } catch (error) {
            logger.error(`Error creating tag: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves a tag by ID or slug
     * @param {Object} params - Parameters
     * @param {string} [params.tagId] - UUID of the tag
     * @param {string} [params.slug] - Slug of the tag
     * @returns {Promise<Object>} - Tag object
     */
    async getTag({ tagId, slug }) {
        try {
            if (!tagId && !slug) throw new ValidationError('Tag ID or slug is required');
            const cacheKey = tagId ? `tag:id:${tagId}` : `tag:slug:${slug.toLowerCase()}`;

            if (this.redisService.enabled) {
                const cachedTag = await this.redisService.get(cacheKey);
                if (cachedTag) {
                    logger.info(`Cache hit for tag ${tagId || slug}`);
                    return cachedTag;
                }
            }

            const tag = await this.Tag.findOne({
                where: tagId ? { id: tagId } : { slug },
                paranoid: true
            });

            if (!tag) {
                throw new NotFoundError('Tag not found');
            }

            if (this.redisService.enabled) {
                await this.redisService.set(cacheKey, tag, this.CACHE_TTL);
                logger.info(`Cache set for tag ${tagId || slug}`);
            }

            return tag;
        } catch (error) {
            logger.error(`Error fetching tag ${tagId || slug}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves all tags with pagination
     * @param {Object} params - Parameters
     * @param {number} [params.page=1] - Page number
     * @param {number} [params.pageSize=10] - Items per page
     * @returns {Promise<Object>} - Paginated tags
     */
    async getAllTags({ page = 1, pageSize = 10 }) {
        try {
            const cacheKey = `tags:all:page:${page}:size:${pageSize}`;

            if (this.redisService.enabled) {
                const cachedTags = await this.redisService.get(cacheKey);
                if (cachedTags) {
                    logger.info(`Cache hit for all tags`);
                    return cachedTags;
                }
            }

            const offset = (page - 1) * pageSize;
            const { rows: items, count: total } = await this.Tag.findAndCountAll({
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
                logger.info(`Cache set for all tags`);
            }

            return result;
        } catch (error) {
            logger.error(`Error fetching all tags: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates a tag
     * @param {string} tagId - UUID of the tag
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} - Updated tag
     */
    async updateTag(tagId, updateData) {
        try {
            this.#validateTagData(updateData);

            const tag = await this.Tag.findByPk(tagId, { paranoid: true });
            if (!tag) {
                throw new NotFoundError('Tag not found');
            }

            const updatedTag = await withTransaction(this.db.sequelize, async (transaction) => {
                if (updateData.name) {
                    updateData.slug = await this.#generateSlug(updateData.name, tagId);
                }
                await tag.update(
                    { ...updateData, updated_at: new Date() },
                    { transaction }
                );
                return tag;
            });

            if (this.redisService.enabled) {
                await this.redisService.del(`tag:id:${tagId}`);
                await this.redisService.del(`tag:slug:${tag.slug.toLowerCase()}`);
                await this.redisService.del('tags:all');
            }

            return updatedTag;
        } catch (error) {
            logger.error(`Error updating tag ${tagId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deletes a tag (soft delete)
     * @param {string} tagId - UUID of the tag
     * @returns {Promise<boolean>} - True if deleted
     */
    async deleteTag(tagId) {
        try {
            const tag = await this.Tag.findByPk(tagId, { paranoid: true });
            if (!tag) {
                throw new NotFoundError('Tag not found');
            }

            await withTransaction(this.db.sequelize, async (transaction) => {
                await this.BlogTagMapping.destroy({ where: { tag_id: tagId }, transaction });
                await tag.destroy({ transaction });
            });

            if (this.redisService.enabled) {
                await this.redisService.del(`tag:id:${tagId}`);
                await this.redisService.del(`tag:slug:${tag.slug.toLowerCase()}`);
                await this.redisService.del('tags:all');
            }

            return true;
        } catch (error) {
            logger.error(`Error deleting tag ${tagId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validates tag data
     * @param {Object} tagData - Tag data to validate
     */
    #validateTagData({ name }) {
        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            throw new ValidationError('Name is required and must be at least 3 characters long');
        }
    }

    /**
     * Generates a unique slug for a tag
     * @param {string} name - Tag name
     * @param {string} [tagId] - Tag UUID for uniqueness
     * @returns {Promise<string>} - Generated slug
     */
    async #generateSlug(name, tagId = null) {
        let slug = slugify(name, { lower: true, strict: true });
        if (tagId) {
            slug = `${slug}-${tagId}`;
        }
        const existingTag = await this.Tag.findOne({ where: { slug } });
        if (existingTag && existingTag.id !== tagId) {
            slug = `${slug}-${Date.now()}`;
        }
        return slug;
    }
}

module.exports = TagService;