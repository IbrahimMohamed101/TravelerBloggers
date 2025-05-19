const Joi = require('joi');

// Common fields for blog-related validations
const commonBlogFields = {
    title: Joi.string().min(3).max(200).required().messages({
        'string.base': 'Title must be a string',
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required'
    }),
    content: Joi.string().min(10).required().messages({
        'string.base': 'Content must be a string',
        'string.min': 'Content must be at least 10 characters long',
        'any.required': 'Content is required'
    }),
    author_id: Joi.string().uuid().optional().messages({
        'string.base': 'Author ID must be a string',
        'string.uuid': 'Author ID must be a valid UUID'
    }),
    tags: Joi.array().items(Joi.string().uuid()).optional().messages({
        'array.base': 'Tags must be an array of UUIDs',
        'string.uuid': 'Each tag must be a valid UUID'
    }),
    categories: Joi.array().items(Joi.string().uuid()).optional().messages({
        'array.base': 'Categories must be an array of UUIDs',
        'string.uuid': 'Each category must be a valid UUID'
    }),
    is_public: Joi.boolean().optional().messages({
        'boolean.base': 'is_public must be a boolean'
    }),
    status: Joi.string().valid('draft', 'published', 'archived').optional().messages({
        'any.only': 'Status must be one of: draft, published, archived'
    })
};

// Schema for creating a blog
const createBlogSchema = Joi.object({
    ...commonBlogFields
});

// Schema for updating a blog
const updateBlogSchema = Joi.object({
    title: commonBlogFields.title.optional(),
    content: commonBlogFields.content.optional(),
    author_id: commonBlogFields.author_id.optional(),
    tags: commonBlogFields.tags,
    categories: commonBlogFields.categories,
    is_public: commonBlogFields.is_public,
    status: commonBlogFields.status
});

// Schema for filtering blogs
const filterBlogsSchema = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
    }),
    pageSize: Joi.number().integer().min(1).optional().messages({
        'number.base': 'PageSize must be a number',
        'number.integer': 'PageSize must be an integer',
        'number.min': 'PageSize must be at least 1'
    }),
    status: commonBlogFields.status,
    is_public: commonBlogFields.is_public,
    title: Joi.string().optional().messages({
        'string.base': 'Title must be a string'
    }),
    author: Joi.string().optional().messages({
        'string.base': 'Author must be a string'
    }),
    tags: commonBlogFields.tags,
    categories: commonBlogFields.categories
}).options({ stripUnknown: true });

// Schema for toggling a reaction
const reactionSchema = Joi.object({
    reactionType: Joi.string().valid('like', 'love', 'wow', 'sad', 'angry').required().messages({
        'any.only': 'Reaction type must be one of: like, love, wow, sad, angry',
        'any.required': 'Reaction type is required'
    })
});

// Schema for adding a comment
const commentSchema = Joi.object({
    content: Joi.string().min(3).required().messages({
        'string.base': 'Comment content must be a string',
        'string.min': 'Comment content must be at least 3 characters long',
        'any.required': 'Comment content is required'
    })
});

// Schema for getting comments
const getCommentsSchema = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
    }),
    pageSize: Joi.number().integer().min(1).optional().messages({
        'number.base': 'PageSize must be a number',
        'number.integer': 'PageSize must be an integer',
        'number.min': 'PageSize must be at least 1'
    })
}).options({ stripUnknown: true });

// Generic validation middleware
const validate = (schema, property = 'body') => (req, res, next) => {
    const { error } = schema.validate(req[property], {
        abortEarly: false, // Return all errors
        stripUnknown: true // Remove unknown fields
    });

    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }

    next();
};

// Export validation middleware
module.exports = {
    validate,
    validateCreateBlog: validate(createBlogSchema),
    validateUpdateBlog: validate(updateBlogSchema),
    validateFilterBlogs: validate(filterBlogsSchema, 'query'),
    validateReaction: validate(reactionSchema),
    validateComment: validate(commentSchema),
    validateGetComments: validate(getCommentsSchema, 'query')
};