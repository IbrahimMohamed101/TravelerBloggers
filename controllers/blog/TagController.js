const { ValidationError } = require('../../errors/CustomErrors');
const TagService = require('../../services/blog/TagService');

class TagController {
    constructor(db, redisService) {
        this.tagService = new TagService(db, redisService);
    }

    /**
     * Creates a new tag
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createTag(req, res) {
        try {
            const tagData = req.body;
            // Basic validation in controller; detailed validation should be in TagService
            if (!tagData.name) {
                throw new ValidationError('Tag name is required');
            }
            const tag = await this.tagService.createTag(tagData);
            res.status(201).json(tag);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Retrieves a tag by ID or slug
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getTag(req, res) {
        try {
            const { tagId, slug } = req.params;
            if (!tagId && !slug) {
                throw new ValidationError('Tag ID or slug is required');
            }
            const tag = await this.tagService.getTag({ tagId, slug });
            res.status(200).json(tag);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Retrieves all tags with pagination
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllTags(req, res) {
        try {
            const { page = 1, pageSize = 10 } = req.query;
            const tags = await this.tagService.getAllTags({ page, pageSize });
            res.status(200).json(tags);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Updates a tag
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateTag(req, res) {
        try {
            const { tagId } = req.params;
            const updateData = req.body;
            if (!updateData.name) {
                throw new ValidationError('Tag name is required');
            }
            const updatedTag = await this.tagService.updateTag(tagId, updateData);
            res.status(200).json(updatedTag);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes a tag
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteTag(req, res) {
        try {
            const { tagId } = req.params;
            if (!tagId) {
                throw new ValidationError('Tag ID is required');
            }
            await this.tagService.deleteTag(tagId);
            res.status(204).send();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TagController;