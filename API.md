# 🌍 Traveler Bloggers API Documentation

Welcome to the Traveler Bloggers API! This API powers a travel blogging and social platform, including user authentication, content creation, trip planning, and more.

---

## 🔐 Authentication Endpoints

### Basic Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user with `{ name, email, password }` |
| GET | `/api/auth/verify-email?token=<token>` | Activate user account using the email verification token |
| POST | `/api/auth/login` | Log in with `{ email, password }`, returns access & refresh tokens |
| POST | `/api/auth/logout` | Invalidate the current refresh token |
| POST | `/api/auth/refresh-token` | Use `{ refreshToken }` to obtain a new access token |

### Password Reset
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/password/forgot` | Request password reset link using `{ email }` |
| POST | `/api/auth/password/reset` | Reset password with `{ token, newPassword }` |

### User Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Fetch current user's data using access token |
| PUT | `/api/auth/me` | Update user's name, avatar, or other profile info |

### OAuth Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Redirect to Google for login |
| GET | `/api/auth/google/callback` | Google OAuth callback endpoint |
| GET | `/api/auth/facebook` | Redirect to Facebook for login |
| GET | `/api/auth/facebook/callback` | Facebook OAuth callback endpoint |
| GET | `/api/auth/discord` | Redirect to Discord for login |
| GET | `/api/auth/discord/callback` | Discord OAuth callback endpoint |

### Two-Factor Authentication (2FA)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/2fa/setup` | Generate and return QR code & secret |
| POST | `/api/auth/2fa/verify` | Verify TOTP code for login |
| POST | `/api/auth/2fa/disable` | Disable 2FA for the user |

---

## 👤 User Management

### Profile
```
GET /api/users/profile
PUT /api/users/profile
DELETE /api/users/profile
PUT /api/users/profile/avatar
DELETE /api/users/profile/avatar
```

### Settings
```
GET /api/users/settings
PUT /api/users/settings
PUT /api/users/settings/notifications
PUT /api/users/settings/privacy
```

### Relationships
```
GET /api/users/followers
GET /api/users/following
POST /api/users/follow/{userId}
DELETE /api/users/unfollow/{userId}
```

---

## 📝 Blog Management

### Blog Posts
```
GET /api/blogs
GET /api/blogs/{blogId}
POST /api/blogs
PUT /api/blogs/{blogId}
DELETE /api/blogs/{blogId}
```

### Categories & Tags
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

### Comments
```
GET /api/blogs/{blogId}/comments
POST /api/blogs/{blogId}/comments
PUT /api/blogs/{blogId}/comments/{commentId}
DELETE /api/blogs/{blogId}/comments/{commentId}
```

---

## 🗺️ Travel Plans

### Trips
```
GET /api/trips
GET /api/trips/{tripId}
POST /api/trips
PUT /api/trips/{tripId}
DELETE /api/trips/{tripId}
```

### Locations
```
GET /api/trips/{tripId}/locations
POST /api/trips/{tripId}/locations
PUT /api/trips/{tripId}/locations/{locationId}
DELETE /api/trips/{tripId}/locations/{locationId}
```

### Sharing
```
POST /api/trips/{tripId}/share
PUT /api/trips/{tripId}/privacy
GET /api/trips/shared-with-me
```

---

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

---

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

---

## 👨‍💼 Admin Panel

### Users
```
GET /api/admin/users
PUT /api/admin/users/{userId}/role
PUT /api/admin/users/{userId}/status
DELETE /api/admin/users/{userId}
```

### Blogs & Comments
```
GET /api/admin/blogs/reported
PUT /api/admin/blogs/{blogId}/status
DELETE /api/admin/blogs/{blogId}
GET /api/admin/comments/reported
```

### System
```
GET /api/admin/system/stats
GET /api/admin/system/logs
POST /api/admin/announcements
PUT /api/admin/settings
```

---

## 🔔 Notifications

```
GET /api/notifications
PUT /api/notifications/{notificationId}/read
DELETE /api/notifications/{notificationId}
PUT /api/notifications/read-all
GET /api/notifications/settings
PUT /api/notifications/settings
```

---

## 📱 Device & Session Management

### Devices
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