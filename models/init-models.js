var DataTypes = require("sequelize").DataTypes;

var _admin_logs = require("./admin_logs");
var _audit_logs = require("./audit_logs");
var _blog_categories = require("./blog_categories");
var _blog_reactions = require("./blog_reactions");
var _blogs = require("./blogs");
var _categories = require("./categories");
var _comment_reactions = require("./comment_reactions");
var _comments = require("./comments");
var _contact_messages = require("./contact_messages");
var _events = require("./events");
var _followers = require("./followers");
var _guest_users = require("./guest_users");
var _notifications = require("./notifications");
var _permissions = require("./permissions");
var _post_reactions = require("./post_reactions");
var _posts = require("./posts");
var _reactions = require("./reactions");
var _sessions = require("./sessions");
var _travel_plan_locations = require("./travel_plan_locations");
var _travel_plan_shares = require("./travel_plan_shares");
var _travel_plans = require("./travel_plans");
var _trophies = require("./trophies");
var _user_trophies = require("./user_trophies");
var _users = require("./users");
var _user_permissions = require("./user_permissions");
var _refresh_tokens = require("./refresh_tokens");
var _email_verification_tokens = require("./email_verification_tokens");
var _password_reset_tokens = require("./password_reset_tokens");
var _role_permissions = require("./role_permissions");
var _refresh_tokens = require("./refresh_tokens");


function initModels(sequelize) {
  var admin_logs = _admin_logs(sequelize, DataTypes);
  var audit_logs = _audit_logs(sequelize, DataTypes);
  var blog_categories = _blog_categories(sequelize, DataTypes);
  var blog_reactions = _blog_reactions(sequelize, DataTypes);
  var blogs = _blogs(sequelize, DataTypes);
  var categories = _categories(sequelize, DataTypes);
  var comment_reactions = _comment_reactions(sequelize, DataTypes);
  var comments = _comments(sequelize, DataTypes);
  var contact_messages = _contact_messages(sequelize, DataTypes);
  var events = _events(sequelize, DataTypes);
  var followers = _followers(sequelize, DataTypes);
  var guest_users = _guest_users(sequelize, DataTypes);
  var notifications = _notifications(sequelize, DataTypes);
  var permissions = _permissions(sequelize, DataTypes);
  var post_reactions = _post_reactions(sequelize, DataTypes);
  var posts = _posts(sequelize, DataTypes);
  var reactions = _reactions(sequelize, DataTypes);
  var sessions = _sessions(sequelize, DataTypes);
  var travel_plan_locations = _travel_plan_locations(sequelize, DataTypes);
  var travel_plan_shares = _travel_plan_shares(sequelize, DataTypes);
  var travel_plans = _travel_plans(sequelize, DataTypes);
  var trophies = _trophies(sequelize, DataTypes);
  var user_trophies = _user_trophies(sequelize, DataTypes);
  var user_permissions = _user_permissions(sequelize, DataTypes);
  var refresh_tokens = _refresh_tokens(sequelize, DataTypes);
  var email_verification_tokens = _email_verification_tokens(sequelize, DataTypes);
  var password_reset_tokens = _password_reset_tokens(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var role_permissions = _role_permissions(sequelize, DataTypes);
  var refresh_tokens = _refresh_tokens(sequelize, DataTypes);


  // Relationships
  // Blogs & Comments
  comments.belongsTo(blogs, { as: "blog", foreignKey: "blog_id" });
  blogs.hasMany(comments, { as: "comments", foreignKey: "blog_id" });

  // Blogs & Reactions
  reactions.belongsTo(blogs, { as: "blog", foreignKey: "blog_id" });
  blogs.hasMany(reactions, { as: "reactions", foreignKey: "blog_id" });

  // Comments & Reactions
  comment_reactions.belongsTo(comments, { as: "comment", foreignKey: "comment_id" });
  comments.hasMany(comment_reactions, { as: "comment_reactions", foreignKey: "comment_id" });

  // Posts & Comments
  comments.belongsTo(posts, { as: "post", foreignKey: "post_id" });
  posts.hasMany(comments, { as: "comments", foreignKey: "post_id" });

  // Posts & Reactions
  post_reactions.belongsTo(posts, { as: "post", foreignKey: "post_id" });
  posts.hasMany(post_reactions, { as: "post_reactions", foreignKey: "post_id" });

  // Generic Reactions to Posts & Comments
  reactions.belongsTo(posts, { as: "post", foreignKey: "post_id" });
  posts.hasMany(reactions, { as: "reactions", foreignKey: "post_id" });
  reactions.belongsTo(comments, { as: "comment", foreignKey: "comment_id" });
  comments.hasMany(reactions, { as: "reactions", foreignKey: "comment_id" });

  // User & Trophies
  user_trophies.belongsTo(trophies, { as: "trophy", foreignKey: "trophy_id" });
  trophies.hasMany(user_trophies, { as: "user_trophies", foreignKey: "trophy_id" });

  // User & Admin Logs
  admin_logs.belongsTo(users, { as: "admin", foreignKey: "admin_id" });
  users.hasMany(admin_logs, { as: "admin_logs", foreignKey: "admin_id" });

  // User & Audit Logs
  audit_logs.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(audit_logs, { as: "audit_logs", foreignKey: "user_id" });

  // Blogs & Authors
  blogs.belongsTo(users, { as: "author", foreignKey: "author_id" });
  users.hasMany(blogs, { as: "blogs", foreignKey: "author_id" });

  // Comments & Users
  comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(comments, { as: "comments", foreignKey: "user_id" });

  // Contact Messages
  contact_messages.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(contact_messages, { as: "contact_messages", foreignKey: "user_id" });

  // Events
  events.belongsTo(users, { as: "created_by_user", foreignKey: "created_by" });
  users.hasMany(events, { as: "events", foreignKey: "created_by" });

  // Followers (user-user)
  followers.belongsTo(users, { as: "follower", foreignKey: "follower_id" });
  users.hasMany(followers, { as: "followers", foreignKey: "follower_id" });
  followers.belongsTo(users, { as: "following", foreignKey: "following_id" });
  users.hasMany(followers, { as: "following_followers", foreignKey: "following_id" });

  // Notifications
  notifications.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(notifications, { as: "notifications", foreignKey: "user_id" });

  // Sessions
  sessions.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(sessions, { as: "sessions", foreignKey: "user_id" });

  // Permissions (if linked to users)
  permissions.belongsTo(users, { as: "user", foreignKey: "user_id" });
  // Commenting out hasMany to avoid alias conflict
  // users.hasMany(permissions, { as: "permissions", foreignKey: "user_id" });

  // User Permissions (many-to-many)
  users.belongsToMany(permissions, {
    through: user_permissions,
    foreignKey: 'user_id',
    otherKey: 'permission_id',
    as: 'permissions'
  });
  permissions.belongsToMany(users, {
    through: user_permissions,
    foreignKey: 'permission_id',
    otherKey: 'user_id',
    as: 'users'
  });

  // Add any associations for new token models here if needed

  // Travel Plans & User
  travel_plans.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(travel_plans, { as: "travel_plans", foreignKey: "user_id" });

  // Travel Plan Locations
  travel_plan_locations.belongsTo(travel_plans, { as: "plan", foreignKey: "travel_plan_id" });
  travel_plans.hasMany(travel_plan_locations, { as: "locations", foreignKey: "travel_plan_id" });

  // Travel Plan Shares
  travel_plan_shares.belongsTo(travel_plans, { as: "plan", foreignKey: "travel_plan_id" });
  travel_plans.hasMany(travel_plan_shares, { as: "shares", foreignKey: "travel_plan_id" });
  travel_plan_shares.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(travel_plan_shares, { as: "travel_plan_shares", foreignKey: "user_id" });

  // Blog <-> Category (Many-to-Many)
  blogs.belongsToMany(categories, { through: blog_categories, foreignKey: "blog_id", otherKey: "category_id" });
  categories.belongsToMany(blogs, { through: blog_categories, foreignKey: "category_id", otherKey: "blog_id" });

  // Blog Reactions
  blog_reactions.belongsTo(blogs, { as: "blog", foreignKey: "blog_id" });
  blogs.hasMany(blog_reactions, { as: "blog_reactions", foreignKey: "blog_id" });
  blog_reactions.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(blog_reactions, { as: "blog_reactions", foreignKey: "user_id" });

  return {
    admin_logs,
    audit_logs,
    blog_categories,
    blog_reactions,
    blogs,
    categories,
    comment_reactions,
    comments,
    contact_messages,
    events,
    followers,
    guest_users,
    notifications,
    permissions,
    post_reactions,
    posts,
    reactions,
    sessions,
    travel_plan_locations,
    travel_plan_shares,
    travel_plans,
    trophies,
    user_trophies,
    user_permissions,
    refresh_tokens,
    email_verification_tokens,
    password_reset_tokens,
    users,
    role_permissions,
    refresh_tokens,
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
