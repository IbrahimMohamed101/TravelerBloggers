# 🌍 Traveler Bloggers API Documentation

## 🔐 Authentication Endpoints

### Registration & Login
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
DELETE /api/auth/logout-all-devices
```

### Email Verification
```
POST /api/auth/verify-email
POST /api/auth/resend-verification
```

### Password Management
```
POST /api/auth/forgot-password
POST /api/auth/reset-password
PUT /api/auth/change-password
```

### OAuth Authentication
```
GET /api/auth/google
GET /api/auth/google/callback
GET /api/auth/facebook
GET /api/auth/facebook/callback
```

## 👤 User Management

### Profile Management
```
GET /api/users/profile
PUT /api/users/profile
DELETE /api/users/profile
PUT /api/users/profile/avatar
DELETE /api/users/profile/avatar
```

### User Settings
```
GET /api/users/settings
PUT /api/users/settings
PUT /api/users/settings/notifications
PUT /api/users/settings/privacy
```

### User Relationships
```
GET /api/users/followers
GET /api/users/following
POST /api/users/follow/{userId}
DELETE /api/users/unfollow/{userId}
```

## 📝 Blog Management

### Blog Posts
```
GET /api/blogs
GET /api/blogs/{blogId}
POST /api/blogs
PUT /api/blogs/{blogId}
DELETE /api/blogs/{blogId}
```

### Blog Categories & Tags
```
GET /api/blogs/categories
POST /api/blogs/categories
GET /api/blogs/tags
POST /api/blogs/tags/{blogId}
DELETE /api/blogs/tags/{blogId}
```

### Blog Interactions
```
POST /api/blogs/{blogId}/like
DELETE /api/blogs/{blogId}/unlike
POST /api/blogs/{blogId}/save
DELETE /api/blogs/{blogId}/unsave
GET /api/blogs/saved
```

### Blog Comments
```
GET /api/blogs/{blogId}/comments
POST /api/blogs/{blogId}/comments
PUT /api/blogs/{blogId}/comments/{commentId}
DELETE /api/blogs/{blogId}/comments/{commentId}
```

## 🗺️ Travel Plans

### Trip Management
```
GET /api/trips
GET /api/trips/{tripId}
POST /api/trips
PUT /api/trips/{tripId}
DELETE /api/trips/{tripId}
```

### Trip Details
```
GET /api/trips/{tripId}/locations
POST /api/trips/{tripId}/locations
PUT /api/trips/{tripId}/locations/{locationId}
DELETE /api/trips/{tripId}/locations/{locationId}
```

### Trip Sharing
```
POST /api/trips/{tripId}/share
PUT /api/trips/{tripId}/privacy
GET /api/trips/shared-with-me
```

## 🔍 Search & Discovery

### Search
```
GET /api/search/blogs
GET /api/search/users
GET /api/search/locations
GET /api/search/trips
```

### Recommendations
```
GET /api/discover/trending-blogs
GET /api/discover/popular-locations
GET /api/discover/suggested-users
GET /api/discover/nearby
```

## 📊 Analytics

### User Analytics
```
GET /api/analytics/profile-views
GET /api/analytics/blog-performance
GET /api/analytics/engagement
```

### Content Analytics
```
GET /api/analytics/top-posts
GET /api/analytics/popular-categories
GET /api/analytics/traffic-sources
```

## 👨‍💼 Admin Panel

### User Management
```
GET /api/admin/users
PUT /api/admin/users/{userId}/role
PUT /api/admin/users/{userId}/status
DELETE /api/admin/users/{userId}
```

### Content Management
```
GET /api/admin/blogs/reported
PUT /api/admin/blogs/{blogId}/status
DELETE /api/admin/blogs/{blogId}
GET /api/admin/comments/reported
```

### System Management
```
GET /api/admin/system/stats
GET /api/admin/system/logs
POST /api/admin/announcements
PUT /api/admin/settings
```

## 🔔 Notifications

### Notification Management
```
GET /api/notifications
PUT /api/notifications/{notificationId}/read
DELETE /api/notifications/{notificationId}
PUT /api/notifications/read-all
```

### Notification Settings
```
GET /api/notifications/settings
PUT /api/notifications/settings
```

## 📱 Device Management

### Device Control
```
GET /api/devices
POST /api/devices/register
DELETE /api/devices/{deviceId}
```

### Sessions
```
GET /api/sessions
DELETE /api/sessions/{sessionId}
DELETE /api/sessions/all
```
