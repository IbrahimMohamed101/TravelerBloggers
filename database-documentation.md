# Traveler Bloggers Platform - Database Documentation

## Overview
This document describes the current database structure after recent migrations.

## Tables

### 1. users
- Stores user account information
- Fields:
  - id (UUID, PK)
  - first_name (STRING(50), NOT NULL)
  - last_name (STRING(50), NOT NULL)
  - username (STRING(50), NOT NULL, UNIQUE)
  - email (STRING(100), NOT NULL, UNIQUE)
  - role (ENUM: super_admin, admin, content_manager, user)
  - is_active (BOOLEAN, default: true)
  - bio (STRING(500))
  - profile_image (STRING(1000))
  - gender (ENUM: male, female, other)
  - social_media (JSONB)
  - interested_categories (JSONB, default: [])
  - password (STRING(255))
  - email_verified (BOOLEAN, default: false)
  - email_verified_at (DATE)
  - last_login_at (DATE)

### 2. sessions
- Tracks user sessions
- Fields:
  - id (UUID, PK)
  - user_id (UUID, FK to users, ON DELETE CASCADE)
  - token (STRING(512), UNIQUE)
  - ip_address (STRING(45))
  - user_agent (TEXT)
  - device_info (JSON)
  - expires_at (DATE)
  - is_revoked (BOOLEAN, default: false)
  - is_active (BOOLEAN, default: true) - NEW
  - last_activity (DATE) - NEW

### 3. blog_reactions
- Tracks reactions to blog posts (NEW)
- Fields:
  - id (UUID, PK)
  - user_id (UUID, FK to users, ON DELETE CASCADE)
  - blog_id (UUID, FK to blogs, ON DELETE CASCADE)
  - reaction_type (ENUM: like, love, wow, sad, angry)
  - created_at (DATE, default: NOW)
  - updated_at (DATE, default: NOW)

### 4. post_reactions
- Tracks reactions to posts (NEW)
- Fields: Same structure as blog_reactions but for posts

### 5. comment_reactions
- Tracks reactions to comments (NEW)
- Fields: Same structure as blog_reactions but for comments

## Key Relationships
- users (1) → sessions (many)
- users (1) → blog_reactions (many)
- users (1) → post_reactions (many)
- users (1) → comment_reactions (many)
- blogs (1) → blog_reactions (many)
- posts (1) → post_reactions (many)
- comments (1) → comment_reactions (many)

## Sample Queries

```sql
-- Get active sessions for a user
SELECT * FROM sessions 
WHERE user_id = 'user-uuid' AND is_active = true;

-- Get all like reactions for a blog
SELECT * FROM blog_reactions
WHERE blog_id = 'blog-uuid' AND reaction_type = 'like';

-- Get user's last activity
SELECT username, last_activity 
FROM users u
JOIN sessions s ON u.id = s.user_id
WHERE u.id = 'user-uuid';
```

## Recent Changes
1. Added is_active and last_activity fields to sessions table
2. Added ON DELETE CASCADE to all foreign keys
3. Split reactions into separate tables by content type
4. Created new models for all reaction types
