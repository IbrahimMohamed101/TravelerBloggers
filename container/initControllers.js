const AuthController = require('../controllers/auth/authController');
const OAuthController = require('../controllers/auth/oauthController');
const SessionController = require('../controllers/auth/sessionController');
const UserController = require('../controllers/user/userController');
const PasswordController = require('../controllers/auth/passwordController');
const BlogController = require('../controllers/blog/BlogController');
const CategoryController = require('../controllers/blog/CategoryController');
const TagController = require('../controllers/blog/TagController');
const logger = require('../utils/logger');

function initControllers(services) {
    const controllers = {};

    controllers.authController = new AuthController(
        services.authService,
        services.sessionService,
        services.tokenService,
        services.emailVerificationService
    );

    controllers.oauthController = new OAuthController(services.authService);
    controllers.sessionController = new SessionController(services.sessionService);
    controllers.userController = new UserController(services.userService);
    controllers.passwordController = new PasswordController(services.passwordService);

    controllers.blogController = new BlogController(
        services.blogService,
        services.interactionService
    );
    controllers.categoryController = new CategoryController(services.categoryService);
    controllers.tagController = new TagController(services.tagService);

    logger.info('All controllers initialized');
    return controllers;
}

module.exports = initControllers;