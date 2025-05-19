const { NotFoundError } = require('../../errors/CustomErrors');

class BlogController {
    constructor(blogService, interactionService) {
        this.blogService = blogService;
        this.interactionService = interactionService;
    }

    async createBlog(req, res) {
        try {
            const userId = req.user.userId;
            const blogData = { ...req.body, author_id: userId };
            const blog = await this.blogService.createBlog(userId, blogData);
            res.status(201).json(blog);
        } catch (error) {
            throw error;
        }
    }

    async getBlog(req, res) {
        try {
            const { blogIdOrSlug } = req.params;
            const blog = await this.blogService.getBlog({ blogId: blogIdOrSlug, slug: blogIdOrSlug });
            if (!blog) {
                throw new NotFoundError('Blog not found');
            }
            res.status(200).json(blog);
        } catch (error) {
            throw error;
        }
    }

    async filterBlogs(req, res) {
        try {
            const filterParams = req.query;
            const result = await this.blogService.filterBlogs(filterParams);
            res.status(200).json(result);
        } catch (error) {
            throw error;
        }
    }

    async updateBlog(req, res) {
        try {
            const { blogId } = req.params;
            const updateData = req.body;
            const userId = req.user.userId;
            const userRole = req.user.role;
            const updatedBlog = await this.blogService.updateBlog(blogId, updateData, userId, userRole);
            if (!updatedBlog) {
                throw new NotFoundError('Blog not found');
            }
            res.status(200).json(updatedBlog);
        } catch (error) {
            throw error;
        }
    }

    async deleteBlog(req, res) {
        try {
            const { blogId } = req.params;
            const userId = req.user.userId;
            const userRole = req.user.role;
            const deleted = await this.blogService.deleteBlog(blogId, userId, userRole);
            if (!deleted) {
                throw new NotFoundError('Blog not found');
            }
            res.status(204).send();
        } catch (error) {
            throw error;
        }
    }

    async toggleReaction(req, res) {
        try {
            const { blogId } = req.params;
            const { reactionType } = req.body;
            const userId = req.user.userId;
            const blog = await this.interactionService.toggleReaction(blogId, userId, reactionType);
            res.status(200).json(blog);
        } catch (error) {
            throw error;
        }
    }

    async incrementViews(req, res) {
        try {
            const { blogId } = req.params;
            const blog = await this.interactionService.incrementViews(blogId);
            res.status(200).json(blog);
        } catch (error) {
            throw error;
        }
    }

    async addComment(req, res) {
        try {
            const { blogId } = req.params;
            const userId = req.user.userId;
            const { content } = req.body;
            const comment = await this.interactionService.addComment(blogId, userId, content);
            res.status(201).json(comment);
        } catch (error) {
            throw error;
        }
    }

    async getComments(req, res) {
        try {
            const { blogId } = req.params;
            const { page, pageSize } = req.query;
            const comments = await this.interactionService.getComments(blogId, { page, pageSize });
            res.status(200).json(comments);
        } catch (error) {
            throw error;
        }

    }

    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;
            const userRole = req.user.role;
            const deleted = await this.interactionService.deleteComment(commentId, userId, userRole);
            if (!deleted) {
                throw new NotFoundError('COMMENT_NOT_FOUND');
            }
            res.status(204).send();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = BlogController;