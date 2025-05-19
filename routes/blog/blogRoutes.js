const express = require('express');
const {
    validateCreateBlog,
    validateUpdateBlog,
    validateFilterBlogs,
    validateReaction,
    validateComment,
    validateGetComments
} = require('../../validators/blogValidators');

const authMiddleware = require('../../middlewares/authorization');
const verifyJWT = require('../../middlewares/verifyJWT');
const db = require('../../config/db');

const router = express.Router();

module.exports = (container) => {
    const blogController = container.getController('blogController');

    const isBlogOwner = async (req, userId) => {
        const { blogId } = req.params;
        const blog = await db.blogs.findByPk(blogId, { attributes: ['author_id'] });
        return blog && blog.author_id === userId;
    };

    const isCommentOwner = async (req, userId) => {
        const { commentId } = req.params;
        const comment = await db.comments.findByPk(commentId, { attributes: ['user_id'] });
        return comment && comment.user_id === userId;
    };

    router.post(
        '/',
        verifyJWT(),
        authMiddleware({ requiredPermission: 'create_blog' }),
        validateCreateBlog,
        blogController.createBlog.bind(blogController)
    );

    router.get(
        '/:blogIdOrSlug',
        blogController.getBlog.bind(blogController)
    );

    router.get(
        '/',
        validateFilterBlogs,
        blogController.filterBlogs.bind(blogController)
    );

    router.put(
        '/:blogId',
        verifyJWT(),
        authMiddleware({ requiredPermission: 'edit_blog', ownershipCheck: isBlogOwner }),
        validateUpdateBlog,
        blogController.updateBlog.bind(blogController)
    );

    router.delete(
        '/:blogId',
        verifyJWT(),
        authMiddleware({ requiredPermission: 'delete_blog', ownershipCheck: isBlogOwner }),
        blogController.deleteBlog.bind(blogController)
    );

    router.post(
        '/:blogId/reactions',
        verifyJWT(),
        authMiddleware({ requiredPermission: 'create_blog' }),
        validateReaction,
        blogController.toggleReaction.bind(blogController)
    );

    router.post(
        '/:blogId/views',
        blogController.incrementViews.bind(blogController)
    );

    router.post(
        '/:blogId/comments',
        verifyJWT(),
        authMiddleware({ requiredPermission: 'create_blog' }),
        validateComment,
        blogController.addComment.bind(blogController)
    );

    router.get(
        '/:blogId/comments',
        validateGetComments,
        blogController.getComments.bind(blogController)
    );

    router.delete(
        '/:commentId/comments',
        verifyJWT(),
        authMiddleware,
        blogController.deleteComment.bind(blogController)
    );

    router.delete(
        '/:commentId/comments',
        verifyJWT(),
        authMiddleware({ requiredPermission: 'moderate_content', ownershipCheck: isCommentOwner }),
        blogController.deleteComment.bind(blogController)
    );

    return router;
};