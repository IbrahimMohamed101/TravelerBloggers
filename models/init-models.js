var DataTypes = require("sequelize").DataTypes;
var _admin_logs = require("./admin_logs");
var _blogs = require("./blogs");
var _comments = require("./comments");
var _contact_messages = require("./contact_messages");
var _events = require("./events");
var _followers = require("./followers");
var _guest_users = require("./guest_users");
var _notifications = require("./notifications");
var _posts = require("./posts");
var _reactions = require("./reactions");
var _travel_plans = require("./travel_plans");
var _trophies = require("./trophies");
var _user_trophies = require("./user_trophies");
var _users = require("./users");

function initModels(sequelize) {
  var admin_logs = _admin_logs(sequelize, DataTypes);
  var blogs = _blogs(sequelize, DataTypes);
  var comments = _comments(sequelize, DataTypes);
  var contact_messages = _contact_messages(sequelize, DataTypes);
  var events = _events(sequelize, DataTypes);
  var followers = _followers(sequelize, DataTypes);
  var guest_users = _guest_users(sequelize, DataTypes);
  var notifications = _notifications(sequelize, DataTypes);
  var posts = _posts(sequelize, DataTypes);
  var reactions = _reactions(sequelize, DataTypes);
  var travel_plans = _travel_plans(sequelize, DataTypes);
  var trophies = _trophies(sequelize, DataTypes);
  var user_trophies = _user_trophies(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  comments.belongsTo(blogs, { as: "blog", foreignKey: "blog_id"});
  blogs.hasMany(comments, { as: "comments", foreignKey: "blog_id"});
  reactions.belongsTo(blogs, { as: "blog", foreignKey: "blog_id"});
  blogs.hasMany(reactions, { as: "reactions", foreignKey: "blog_id"});
  reactions.belongsTo(comments, { as: "comment", foreignKey: "comment_id"});
  comments.hasMany(reactions, { as: "reactions", foreignKey: "comment_id"});
  comments.belongsTo(posts, { as: "post", foreignKey: "post_id"});
  posts.hasMany(comments, { as: "comments", foreignKey: "post_id"});
  reactions.belongsTo(posts, { as: "post", foreignKey: "post_id"});
  posts.hasMany(reactions, { as: "reactions", foreignKey: "post_id"});
  user_trophies.belongsTo(trophies, { as: "trophy", foreignKey: "trophy_id"});
  trophies.hasMany(user_trophies, { as: "user_trophies", foreignKey: "trophy_id"});
  admin_logs.belongsTo(users, { as: "admin", foreignKey: "admin_id"});
  users.hasMany(admin_logs, { as: "admin_logs", foreignKey: "admin_id"});
  blogs.belongsTo(users, { as: "author", foreignKey: "author_id"});
  users.hasMany(blogs, { as: "blogs", foreignKey: "author_id"});
  comments.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(comments, { as: "comments", foreignKey: "user_id"});
  contact_messages.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(contact_messages, { as: "contact_messages", foreignKey: "user_id"});
  events.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(events, { as: "events", foreignKey: "created_by"});
  followers.belongsTo(users, { as: "follower", foreignKey: "follower_id"});
  users.hasMany(followers, { as: "followers", foreignKey: "follower_id"});
  followers.belongsTo(users, { as: "following", foreignKey: "following_id"});
  users.hasMany(followers, { as: "following_followers", foreignKey: "following_id"});
  notifications.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(notifications, { as: "notifications", foreignKey: "user_id"});
  posts.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(posts, { as: "posts", foreignKey: "user_id"});
  reactions.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(reactions, { as: "reactions", foreignKey: "user_id"});
  travel_plans.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(travel_plans, { as: "travel_plans", foreignKey: "user_id"});
  user_trophies.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_trophies, { as: "user_trophies", foreignKey: "user_id"});

  return {
    admin_logs,
    blogs,
    comments,
    contact_messages,
    events,
    followers,
    guest_users,
    notifications,
    posts,
    reactions,
    travel_plans,
    trophies,
    user_trophies,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
