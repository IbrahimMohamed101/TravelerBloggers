--
-- PostgreSQL database dump
--

-- Dumped from database version 13.20 (Debian 13.20-1.pgdg120+1)
-- Dumped by pg_dump version 13.20 (Debian 13.20-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_blog_reactions_reaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_blog_reactions_reaction_type AS ENUM (
    'like',
    'love',
    'wow',
    'sad',
    'angry'
);


ALTER TYPE public.enum_blog_reactions_reaction_type OWNER TO postgres;

--
-- Name: enum_blogs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_blogs_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum_blogs_status OWNER TO postgres;

--
-- Name: enum_comment_reactions_reaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_comment_reactions_reaction_type AS ENUM (
    'like',
    'love',
    'wow',
    'sad',
    'angry'
);


ALTER TYPE public.enum_comment_reactions_reaction_type OWNER TO postgres;

--
-- Name: enum_contact_messages_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_contact_messages_status AS ENUM (
    'open',
    'resolved'
);


ALTER TYPE public.enum_contact_messages_status OWNER TO postgres;

--
-- Name: enum_events_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_events_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum_events_status OWNER TO postgres;

--
-- Name: enum_post_reactions_reaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_post_reactions_reaction_type AS ENUM (
    'like',
    'love',
    'wow',
    'sad',
    'angry'
);


ALTER TYPE public.enum_post_reactions_reaction_type OWNER TO postgres;

--
-- Name: enum_posts_visibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_posts_visibility AS ENUM (
    'public',
    'followers',
    'private'
);


ALTER TYPE public.enum_posts_visibility OWNER TO postgres;

--
-- Name: enum_reactions_reaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_reactions_reaction_type AS ENUM (
    'like',
    'love',
    'wow',
    'sad',
    'angry'
);


ALTER TYPE public.enum_reactions_reaction_type OWNER TO postgres;

--
-- Name: enum_users_gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_gender AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public.enum_users_gender OWNER TO postgres;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_role AS ENUM (
    'super_admin',
    'admin',
    'general_user',
    'blogger',
    'content_manager',
    'user'
);


ALTER TYPE public.enum_users_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_logs (
    id uuid NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.admin_logs OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    details text NOT NULL,
    ip_address character varying(255),
    user_agent character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: blog_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_reactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    blog_id uuid NOT NULL,
    reaction_type public.enum_blog_reactions_reaction_type NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.blog_reactions OWNER TO postgres;

--
-- Name: blogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blogs (
    id uuid NOT NULL,
    author_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    cover_image character varying(1000),
    categories jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_public boolean DEFAULT true,
    status public.enum_blogs_status DEFAULT 'draft'::public.enum_blogs_status,
    published_at timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.blogs OWNER TO postgres;

--
-- Name: comment_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_reactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment_id uuid NOT NULL,
    reaction_type public.enum_comment_reactions_reaction_type NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.comment_reactions OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    blog_id uuid,
    post_id uuid,
    content text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    status public.enum_contact_messages_status DEFAULT 'open'::public.enum_contact_messages_status,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    date timestamp with time zone NOT NULL,
    created_by uuid NOT NULL,
    status public.enum_events_status DEFAULT 'draft'::public.enum_events_status,
    categories jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: followers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.followers (
    id uuid NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.followers OWNER TO postgres;

--
-- Name: guest_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_users (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    last_active timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.guest_users OWNER TO postgres;

--
-- Name: guest_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guest_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.guest_users_id_seq OWNER TO postgres;

--
-- Name: guest_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guest_users_id_seq OWNED BY public.guest_users.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    message character varying(1000) NOT NULL,
    categories jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: post_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_reactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    reaction_type public.enum_post_reactions_reaction_type NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.post_reactions OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    image character varying(1000),
    visibility public.enum_posts_visibility DEFAULT 'public'::public.enum_posts_visibility,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    blog_id uuid,
    post_id uuid,
    comment_id uuid,
    reaction_type public.enum_reactions_reaction_type NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.reactions OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token character varying(512) NOT NULL,
    ip_address character varying(45) DEFAULT '0.0.0.0'::character varying NOT NULL,
    user_agent text,
    device_info json,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_activity timestamp with time zone,
    is_refresh boolean DEFAULT false NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: COLUMN sessions.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sessions.is_active IS 'Whether session is currently active';


--
-- Name: COLUMN sessions.last_activity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sessions.last_activity IS 'Timestamp of last activity in session';


--
-- Name: travel_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    location character varying(255) NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.travel_plans OWNER TO postgres;

--
-- Name: trophies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trophies (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(500) NOT NULL,
    rules character varying(1000) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.trophies OWNER TO postgres;

--
-- Name: user_trophies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_trophies (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    trophy_id uuid NOT NULL,
    progress integer DEFAULT 0,
    earned_at timestamp with time zone
);


ALTER TABLE public.user_trophies OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    role public.enum_users_role DEFAULT 'user'::public.enum_users_role NOT NULL,
    bio character varying(500),
    profile_image character varying(1000),
    gender public.enum_users_gender,
    social_media jsonb DEFAULT '{}'::jsonb,
    interested_categories jsonb DEFAULT '[]'::jsonb NOT NULL,
    password character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    email_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: guest_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_users ALTER COLUMN id SET DEFAULT nextval('public.guest_users_id_seq'::regclass);


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
20240101-create-audit-logs.js
20250408091243-add-missing-fields-to-users.js
20250408115409-add-role-fields-to-users.js
20250408115606-create-permissions-table.js
add-role-fields-to-users.js
create-permissions-table.js
20250410000000-improve-sessions-table.js
20250410000001-reorganize-reactions.js
20250409073850-add-audit-logs-foreign-key.js
20240409140000-add-is_refresh-to-sessions.js
\.


--
-- Data for Name: admin_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_logs (id, admin_id, action, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, details, ip_address, user_agent, created_at, updated_at) FROM stdin;
6f4b36d2-1f00-48aa-9cb4-566183de5bc6	067f6f60-04dc-4110-9508-03b87fba1533	REGISTER_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\"}"	\N	\N	2025-04-09 07:29:54.379+00	2025-04-09 07:29:54.379+00
159d0716-7c88-4ccc-a28b-6b49bf917830	067f6f60-04dc-4110-9508-03b87fba1533	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.19.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.19.0.1	PostmanRuntime/7.43.3	2025-04-09 07:51:52.718+00	2025-04-09 07:51:52.718+00
144f1864-ffb6-4fe0-b5a5-913f092cb946	9da968fa-156e-414f-978a-97a00774741f	REGISTER_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\"}"	\N	\N	2025-04-09 07:55:27.268+00	2025-04-09 07:55:27.268+00
7d2d6e81-9be5-4fa0-9468-18d5c81d775f	a88f121a-36dc-4382-a45b-4a23e638cb74	REGISTER_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\"}"	\N	\N	2025-04-09 07:56:31.616+00	2025-04-09 07:56:31.616+00
5f16c578-7acd-4334-9da0-b1d913bfd174	a88f121a-36dc-4382-a45b-4a23e638cb74	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.19.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.19.0.1	PostmanRuntime/7.43.3	2025-04-09 07:56:44.503+00	2025-04-09 07:56:44.503+00
48e076db-c32e-44f1-9321-bd8afe1eca17	08812de7-cb87-4a88-ab01-7b5e19b9742c	REGISTER_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\"}"	\N	\N	2025-04-09 08:16:02.242+00	2025-04-09 08:16:02.242+00
77667e61-f9a6-43f7-b697-0e11053f61fc	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.19.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.19.0.1	PostmanRuntime/7.43.3	2025-04-09 08:17:22.634+00	2025-04-09 08:17:22.634+00
95ed1da1-cc2a-4f80-b2a7-2a8fdc3326f4	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 08:44:16.983+00	2025-04-09 08:44:16.983+00
9a2e39de-20c1-4a43-b50c-895bf4f73ecf	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.21.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.21.0.1	PostmanRuntime/7.43.3	2025-04-09 08:59:26.349+00	2025-04-09 08:59:26.349+00
b12455f6-8626-4df1-9b08-e6035340ad94	08812de7-cb87-4a88-ab01-7b5e19b9742c	PASSWORD_CHANGE	"{}"	\N	\N	2025-04-09 08:59:54.979+00	2025-04-09 08:59:54.979+00
c961941f-9926-442d-bd30-5c80f6e2e3e6	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.21.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.21.0.1	PostmanRuntime/7.43.3	2025-04-09 09:00:13.84+00	2025-04-09 09:00:13.84+00
878308d9-e808-4d7b-8b26-a88c33315ec5	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.21.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.21.0.1	PostmanRuntime/7.43.3	2025-04-09 11:48:18.805+00	2025-04-09 11:48:18.805+00
751beec2-7572-41de-9a3b-79e9525fc57d	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.21.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.21.0.1	PostmanRuntime/7.43.3	2025-04-09 11:51:26.865+00	2025-04-09 11:51:26.865+00
942a5872-ea7c-49e6-bd3e-1044582dbdbd	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.21.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.21.0.1	PostmanRuntime/7.43.3	2025-04-09 12:00:37.825+00	2025-04-09 12:00:37.825+00
13992606-78e8-4cb5-b84b-1288622ad5ca	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.22.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.22.0.1	PostmanRuntime/7.43.3	2025-04-09 12:22:36.89+00	2025-04-09 12:22:36.89+00
45a1d6dc-4efd-4814-b7a8-f81dfe9cc266	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.19.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.19.0.1	PostmanRuntime/7.43.3	2025-04-09 12:50:47.264+00	2025-04-09 12:50:47.264+00
f24111f3-21f2-4eef-bf57-91f89b2a3a66	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:11:02.953+00	2025-04-09 13:11:02.953+00
1e503f33-3fd6-4222-8280-96bd5f7df13b	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:24:41.954+00	2025-04-09 13:24:41.954+00
6178465f-80fb-4b4d-a403-148ae6ee3861	08812de7-cb87-4a88-ab01-7b5e19b9742c	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:24:46.765+00	2025-04-09 13:24:46.765+00
6966f38a-f266-4b05-8d30-bfd671478778	b90bbae5-ca04-4df7-8298-6cd7a852755f	REGISTER_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\"}"	\N	\N	2025-04-09 13:25:17.524+00	2025-04-09 13:25:17.524+00
aa43b545-9083-4d18-ba35-d6a586d8c673	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:25:29.195+00	2025-04-09 13:25:29.195+00
6ee59c15-e99e-4375-9645-821f53d2d01a	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"userAgent\\":null}"	\N	\N	2025-04-09 13:27:37.348+00	2025-04-09 13:27:37.348+00
8300cb12-b17e-43a3-a709-0d722add5ee9	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:30:37.26+00	2025-04-09 13:30:37.26+00
b6bf3257-8689-463f-bc26-74f987ade59c	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:30:39.909+00	2025-04-09 13:30:39.909+00
778080af-a94f-435b-86b4-a0d95333db29	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:33:11.878+00	2025-04-09 13:33:11.878+00
feb00888-c4be-49fe-8f5a-a530f660a2d0	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:34:51.29+00	2025-04-09 13:34:51.29+00
4dde1873-d569-4e08-b4e1-93d0f6538da2	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:37:14.794+00	2025-04-09 13:37:14.794+00
ae02ae6e-9274-46ee-b09f-382dfe86d5c4	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"::ffff:172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	::ffff:172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:39:22.829+00	2025-04-09 13:39:22.829+00
458b1904-c1d9-4c0c-b926-306b7821f4ec	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:39:44.974+00	2025-04-09 13:39:44.974+00
87504325-23db-4226-bb0e-f549091b5d54	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:40:56.487+00	2025-04-09 13:40:56.487+00
f1e87de5-9444-4e4d-9a27-d16bf24366b1	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:43:04.444+00	2025-04-09 13:43:04.444+00
1b3b50da-da6f-457b-9e29-bb172f7fcbc2	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:46:12.975+00	2025-04-09 13:46:12.975+00
9e219f99-44e8-4960-ae00-3d0537cd4e3d	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:53:39.459+00	2025-04-09 13:53:39.459+00
979a73fe-847d-4627-8bbe-05fc8c679930	b90bbae5-ca04-4df7-8298-6cd7a852755f	LOGIN_SUCCESS	"{\\"method\\":\\"OAuth\\",\\"provider\\":\\"None\\",\\"ipAddress\\":\\"172.20.0.1\\",\\"userAgent\\":\\"PostmanRuntime/7.43.3\\"}"	172.20.0.1	PostmanRuntime/7.43.3	2025-04-09 13:56:17.64+00	2025-04-09 13:56:17.64+00
\.


--
-- Data for Name: blog_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_reactions (id, user_id, blog_id, reaction_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: blogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blogs (id, author_id, title, slug, content, cover_image, categories, is_public, status, published_at, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: comment_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_reactions (id, user_id, comment_id, reaction_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, user_id, blog_id, post_id, content, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, user_id, message, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, date, created_by, status, categories, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.followers (id, follower_id, following_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: guest_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_users (id, session_id, last_active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, categories, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: post_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_reactions (id, user_id, post_id, reaction_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, user_id, content, image, visibility, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reactions (id, user_id, blog_id, post_id, comment_id, reaction_type, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token, ip_address, user_agent, device_info, expires_at, is_revoked, created_at, updated_at, is_active, last_activity, is_refresh) FROM stdin;
50abad7b-9f1c-4cf3-a31a-741a594cb6e3	a88f121a-36dc-4382-a45b-4a23e638cb74	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4OGYxMjFhLTM2ZGMtNDM4Mi1hNDViLTRhMjNlNjM4Y2I3NCIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc0NDE4NTQwNCwiZXhwIjoxNzQ0MTg5MDA0fQ.UmzDSDO5KtS2dUap_fPITgb16gE1NZ52v7duJSEYxGs	::ffff:172.19.0.1	PostmanRuntime/7.43.3	\N	2025-05-09 07:56:44.511+00	f	2025-04-09 07:56:44.511+00	2025-04-09 07:56:44.512+00	t	\N	f
8cd89b48-af6a-48a8-a6bb-d030364d1784	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDIwNjM3MiwiZXhwIjoxNzQ2Nzk4MzcyfQ.CL_fOcOOuNYLfgKazffimHALa2L9crZC2RFvZLeagCM	0.0.0.0	\N	\N	2025-05-09 13:46:12.998+00	f	2025-04-09 13:46:12.998+00	2025-04-09 13:46:12.999+00	t	\N	f
e0bf30b1-4e19-4fd4-8a26-740049f07e80	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc0NDIwNjM3MiwiZXhwIjoxNzQ0MjA5OTcyfQ.b0IbZHlo0DQCKh0IffepOzbYNZxdpIdxjdk1Mhi74iQ	172.20.0.1	PostmanRuntime/7.43.3	\N	2025-05-09 13:46:13.012+00	f	2025-04-09 13:46:13.012+00	2025-04-09 13:46:13.012+00	t	\N	f
34de9e6f-c0fc-4da8-8438-b00a7f51bbda	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc0NDIwNjk3NywiZXhwIjoxNzQ0MjEwNTc3fQ.4dcVUA-vP2DopFlR9LJ5HAvRa0EbEpYkTCX3VF0mcNw	172.20.0.1	PostmanRuntime/7.43.3	\N	2025-05-09 13:56:17.658+00	f	2025-04-09 13:56:17.658+00	2025-04-09 13:56:17.658+00	t	\N	f
27c1ef6e-06bf-427c-917f-0dc1b7690c31	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDIwNjk5NCwiZXhwIjoxNzQ2Nzk4OTk0fQ.5nwSyrJEwGJe1wdwtwg9_SCQi0KN6wd8nUv8O2LPnxo	0.0.0.0	\N	\N	2025-05-09 13:56:34.259+00	f	2025-04-09 13:56:34.26+00	2025-04-09 13:56:34.26+00	t	\N	t
cc9d1897-9006-44d5-b750-2acc7e4fcc3b	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDIwNjk3NywiZXhwIjoxNzQ2Nzk4OTc3fQ.sqJRp7emoFPqs-Tlik3_osTdrjwbqpw87jXbJ4AcAtI	0.0.0.0	\N	\N	2025-05-09 13:56:17.65+00	t	2025-04-09 13:56:17.65+00	2025-04-09 13:56:17.65+00	t	\N	t
0ba6d709-2bbb-40cb-8143-18420d80acee	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDI4MjU3MCwiZXhwIjoxNzQ0Mjg2MTcwfQ.MJ5THc28ijofz_Cx5dN4mRnGLVQ2pXXP4hb3KvJ2S6Q	172.18.0.1	PostmanRuntime/7.43.3	\N	2025-05-10 10:56:10.578+00	f	2025-04-10 10:56:10.578+00	2025-04-10 10:56:10.578+00	t	\N	f
d57a68c6-7ef9-452a-a3fd-17c08beb14ba	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDI4MzcxMywiZXhwIjoxNzQ2ODc1NzEzfQ.ZEQ5hjOROSGfJH3iIZ5a6gOAsps2IiOUoufBIm0ERDY	0.0.0.0	\N	\N	2025-05-10 11:15:13.702+00	f	2025-04-10 11:15:13.703+00	2025-04-10 11:15:13.703+00	t	\N	t
0942e8d2-acfc-4d03-a2ba-6679610e76ad	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDI4MjU3MCwiZXhwIjoxNzQ2ODc0NTcwfQ.oPeDWX7XTJFZFUcoxbBjRaD8Kd1OyhuAznqw5k9BJWY	0.0.0.0	\N	\N	2025-05-10 10:56:10.564+00	t	2025-04-10 10:56:10.564+00	2025-04-10 10:56:10.564+00	t	\N	t
a272df27-40a1-4d38-bf56-0e8a4ce208aa	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDI4ODc1NCwiZXhwIjoxNzQ0MjkyMzU0fQ.WfMj-zkJzy3mkH0I7CjIewIcp2PTAd0d3WYDFpHeUYk	172.18.0.1	PostmanRuntime/7.43.3	\N	2025-05-10 12:39:14.163+00	f	2025-04-10 12:39:14.163+00	2025-04-10 12:39:14.163+00	t	\N	f
0b6f862a-df5e-4f42-bdbf-dca5fa367788	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDI4ODc3NCwiZXhwIjoxNzQ2ODgwNzc0fQ.gHr_w993uYLa4YTIjQcTIvcK8R13kFaaUWlVm9O34Xw	0.0.0.0	\N	\N	2025-05-10 12:39:34.197+00	f	2025-04-10 12:39:34.197+00	2025-04-10 12:39:34.197+00	t	\N	t
b7205f27-6d3d-4dbb-a0b4-5a342c6f7fc2	b90bbae5-ca04-4df7-8298-6cd7a852755f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MGJiYWU1LWNhMDQtNGRmNy04Mjk4LTZjZDdhODUyNzU1ZiIsImlhdCI6MTc0NDI4ODc1NCwiZXhwIjoxNzQ2ODgwNzU0fQ.Hj79nQgauJGb38LJuT6qTBZ1ruYR3fmhNsxXw07oHXs	0.0.0.0	\N	\N	2025-05-10 12:39:14.119+00	t	2025-04-10 12:39:14.121+00	2025-04-10 12:39:14.122+00	t	\N	t
\.


--
-- Data for Name: travel_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.travel_plans (id, user_id, location, latitude, longitude, description, is_public, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: trophies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trophies (id, name, description, rules, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_trophies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_trophies (id, user_id, trophy_id, progress, earned_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, first_name, last_name, username, email, role, bio, profile_image, gender, social_media, interested_categories, password, "createdAt", "updatedAt", email_verified, email_verified_at, last_login_at, is_active) FROM stdin;
1f4fd1f4-7293-4e30-b2aa-50cf1f311c7b	atar	hema	hemaatar1	ahmed1@example.com	general_user	\N	\N	\N	{}	[]	$2b$10$dooJGVWOTkurHVO6h15HM.iu3DfXvxB1jD1lwYgpPUaTYM4URHcPm	2025-04-07 15:25:10.856+00	2025-04-07 15:25:10.856+00	f	\N	\N	t
a88f121a-36dc-4382-a45b-4a23e638cb74	hema	atar	hemaatar	hemaatar56@gmail.com	super_admin	\N	\N	\N	{}	[]	$2b$10$WHhjtrwJe907L1MejPnZjeeNUe/JkzKwOnnWFnvJZ/L7lEpJu9JYu	2025-04-09 07:56:31.524+00	2025-04-09 07:56:44.491+00	f	\N	2025-04-09 07:56:44.49+00	t
b90bbae5-ca04-4df7-8298-6cd7a852755f	hgema	atagr	hemagatar	hemaatar4@gmail.com	super_admin	\N	\N	\N	{}	[]	$2b$10$cskFwezrJ8P0dA2/ONFmoO6VglP7yBC60J8oLZgGkdUi/j1gnI0m6	2025-04-09 13:25:17.515+00	2025-04-10 12:39:14.075+00	f	\N	2025-04-10 12:39:14.072+00	t
\.


--
-- Name: guest_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_users_id_seq', 1, false);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: blog_reactions blog_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_reactions
    ADD CONSTRAINT blog_reactions_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_slug_key UNIQUE (slug);


--
-- Name: comment_reactions comment_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (id);


--
-- Name: guest_users guest_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_users
    ADD CONSTRAINT guest_users_pkey PRIMARY KEY (id);


--
-- Name: guest_users guest_users_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_users
    ADD CONSTRAINT guest_users_session_id_key UNIQUE (session_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_name_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key1 UNIQUE (name);


--
-- Name: permissions permissions_name_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key10 UNIQUE (name);


--
-- Name: permissions permissions_name_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key11 UNIQUE (name);


--
-- Name: permissions permissions_name_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key12 UNIQUE (name);


--
-- Name: permissions permissions_name_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key13 UNIQUE (name);


--
-- Name: permissions permissions_name_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key14 UNIQUE (name);


--
-- Name: permissions permissions_name_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key15 UNIQUE (name);


--
-- Name: permissions permissions_name_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key16 UNIQUE (name);


--
-- Name: permissions permissions_name_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key17 UNIQUE (name);


--
-- Name: permissions permissions_name_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key18 UNIQUE (name);


--
-- Name: permissions permissions_name_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key19 UNIQUE (name);


--
-- Name: permissions permissions_name_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key2 UNIQUE (name);


--
-- Name: permissions permissions_name_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key20 UNIQUE (name);


--
-- Name: permissions permissions_name_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key21 UNIQUE (name);


--
-- Name: permissions permissions_name_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key22 UNIQUE (name);


--
-- Name: permissions permissions_name_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key23 UNIQUE (name);


--
-- Name: permissions permissions_name_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key24 UNIQUE (name);


--
-- Name: permissions permissions_name_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key25 UNIQUE (name);


--
-- Name: permissions permissions_name_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key26 UNIQUE (name);


--
-- Name: permissions permissions_name_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key3 UNIQUE (name);


--
-- Name: permissions permissions_name_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key4 UNIQUE (name);


--
-- Name: permissions permissions_name_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key5 UNIQUE (name);


--
-- Name: permissions permissions_name_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key6 UNIQUE (name);


--
-- Name: permissions permissions_name_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key7 UNIQUE (name);


--
-- Name: permissions permissions_name_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key8 UNIQUE (name);


--
-- Name: permissions permissions_name_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key9 UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: post_reactions post_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- Name: sessions sessions_token_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key1 UNIQUE (token);


--
-- Name: sessions sessions_token_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key10 UNIQUE (token);


--
-- Name: sessions sessions_token_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key11 UNIQUE (token);


--
-- Name: sessions sessions_token_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key12 UNIQUE (token);


--
-- Name: sessions sessions_token_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key13 UNIQUE (token);


--
-- Name: sessions sessions_token_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key14 UNIQUE (token);


--
-- Name: sessions sessions_token_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key15 UNIQUE (token);


--
-- Name: sessions sessions_token_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key16 UNIQUE (token);


--
-- Name: sessions sessions_token_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key17 UNIQUE (token);


--
-- Name: sessions sessions_token_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key18 UNIQUE (token);


--
-- Name: sessions sessions_token_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key19 UNIQUE (token);


--
-- Name: sessions sessions_token_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key2 UNIQUE (token);


--
-- Name: sessions sessions_token_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key20 UNIQUE (token);


--
-- Name: sessions sessions_token_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key21 UNIQUE (token);


--
-- Name: sessions sessions_token_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key22 UNIQUE (token);


--
-- Name: sessions sessions_token_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key23 UNIQUE (token);


--
-- Name: sessions sessions_token_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key24 UNIQUE (token);


--
-- Name: sessions sessions_token_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key25 UNIQUE (token);


--
-- Name: sessions sessions_token_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key26 UNIQUE (token);


--
-- Name: sessions sessions_token_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key27 UNIQUE (token);


--
-- Name: sessions sessions_token_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key28 UNIQUE (token);


--
-- Name: sessions sessions_token_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key29 UNIQUE (token);


--
-- Name: sessions sessions_token_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key3 UNIQUE (token);


--
-- Name: sessions sessions_token_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key30 UNIQUE (token);


--
-- Name: sessions sessions_token_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key31 UNIQUE (token);


--
-- Name: sessions sessions_token_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key32 UNIQUE (token);


--
-- Name: sessions sessions_token_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key33 UNIQUE (token);


--
-- Name: sessions sessions_token_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key34 UNIQUE (token);


--
-- Name: sessions sessions_token_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key35 UNIQUE (token);


--
-- Name: sessions sessions_token_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key36 UNIQUE (token);


--
-- Name: sessions sessions_token_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key37 UNIQUE (token);


--
-- Name: sessions sessions_token_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key38 UNIQUE (token);


--
-- Name: sessions sessions_token_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key4 UNIQUE (token);


--
-- Name: sessions sessions_token_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key5 UNIQUE (token);


--
-- Name: sessions sessions_token_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key6 UNIQUE (token);


--
-- Name: sessions sessions_token_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key7 UNIQUE (token);


--
-- Name: sessions sessions_token_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key8 UNIQUE (token);


--
-- Name: sessions sessions_token_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key9 UNIQUE (token);


--
-- Name: travel_plans travel_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans
    ADD CONSTRAINT travel_plans_pkey PRIMARY KEY (id);


--
-- Name: trophies trophies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trophies
    ADD CONSTRAINT trophies_pkey PRIMARY KEY (id);


--
-- Name: user_trophies user_trophies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_trophies
    ADD CONSTRAINT user_trophies_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey1 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey10; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey10 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey11; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey11 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey12; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey12 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey13; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey13 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey14; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey14 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey15; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey15 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey16; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey16 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey17; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey17 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey18; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey18 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey19; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey19 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey2 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey20; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey20 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey21; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey21 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey22; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey22 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey23; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey23 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey24; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey24 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey25; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey25 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey26; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey26 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey3 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey4 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey5 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey6 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey7 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey8 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: admin_logs admin_logs_admin_id_fkey9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey9 FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: blog_reactions blog_reactions_blog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_reactions
    ADD CONSTRAINT blog_reactions_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(id) ON DELETE CASCADE;


--
-- Name: blog_reactions blog_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_reactions
    ADD CONSTRAINT blog_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blogs blogs_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: comment_reactions comment_reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_reactions comment_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_blog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: contact_messages contact_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: followers followers_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: followers followers_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: post_reactions post_reactions_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_reactions post_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reactions reactions_blog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(id);


--
-- Name: reactions reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id);


--
-- Name: reactions reactions_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);


--
-- Name: reactions reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: travel_plans travel_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans
    ADD CONSTRAINT travel_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_trophies user_trophies_trophy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_trophies
    ADD CONSTRAINT user_trophies_trophy_id_fkey FOREIGN KEY (trophy_id) REFERENCES public.trophies(id);


--
-- Name: user_trophies user_trophies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_trophies
    ADD CONSTRAINT user_trophies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

