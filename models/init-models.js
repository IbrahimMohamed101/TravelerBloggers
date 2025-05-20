var DataTypes = require("sequelize").DataTypes;

var _admin_logs = require("./admin_logs");
var _audit_logs = require("./audit_logs");
var _blog_categories = require("./blog_categories");
var _blog_reactions = require("./blog_reactions");
var _blogs = require("./blogs");
var _blog_tags = require("./blog_tags");
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
var _tags = require("./tags");
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
var _roles = require("./roles");

function initModels(sequelize) {
  var admin_logs = _admin_logs(sequelize, DataTypes);
  var audit_logs = _audit_logs(sequelize, DataTypes);
  var blog_categories = _blog_categories(sequelize, DataTypes);
  var blog_reactions = _blog_reactions(sequelize, DataTypes);
  var blogs = _blogs(sequelize, DataTypes);
  var blog_tags = _blog_tags(sequelize, DataTypes);
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
  var tags = _tags(sequelize, DataTypes);
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
  var roles = _roles(sequelize, DataTypes);

  // Create models object
  const models = {
    admin_logs,
    audit_logs,
    blog_categories,
    blog_reactions,
    blogs,
    blog_tags,
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
    tags,
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
    roles
  };

  // Initialize associations
  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return models;
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
