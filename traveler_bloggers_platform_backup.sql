--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_blogs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_blogs_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum_blogs_status OWNER TO postgres;

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
    'admin',
    'general_user',
    'blogger'
);


ALTER TYPE public.enum_users_role OWNER TO postgres;

--
-- Name: gender_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_enum AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public.gender_enum OWNER TO postgres;

--
-- Name: message_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_status_enum AS ENUM (
    'open',
    'resolved'
);


ALTER TYPE public.message_status_enum OWNER TO postgres;

--
-- Name: reaction_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reaction_type_enum AS ENUM (
    'like',
    'love',
    'wow',
    'sad',
    'angry'
);


ALTER TYPE public.reaction_type_enum OWNER TO postgres;

--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_enum AS ENUM (
    'admin',
    'general_user',
    'blogger'
);


ALTER TYPE public.role_enum OWNER TO postgres;

--
-- Name: status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_enum AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.status_enum OWNER TO postgres;

--
-- Name: visibility_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visibility_enum AS ENUM (
    'public',
    'followers',
    'private'
);


ALTER TYPE public.visibility_enum OWNER TO postgres;

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
    ip_address character varying(45) NOT NULL,
    user_agent text,
    device_info json,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

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
    role public.enum_users_role DEFAULT 'general_user'::public.enum_users_role,
    bio character varying(500),
    profile_image character varying(1000),
    gender public.enum_users_gender,
    social_media jsonb DEFAULT '{}'::jsonb,
    interested_categories jsonb DEFAULT '[]'::jsonb NOT NULL,
    password character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
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
20230328-create-users.js
20230328-create-posts.js
\.


--
-- Data for Name: admin_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_logs (id, admin_id, action, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: blogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blogs (id, author_id, title, slug, content, cover_image, categories, is_public, status, published_at, "createdAt", "updatedAt") FROM stdin;
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

COPY public.sessions (id, user_id, token, ip_address, user_agent, device_info, expires_at, is_revoked, created_at, updated_at) FROM stdin;
ded6e17a-6baa-4042-846f-c10d3b606e8b	3b66d313-91b4-4b66-9091-ae9d83397968	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNiNjZkMzEzLTkxYjQtNGI2Ni05MDkxLWFlOWQ4MzM5Nzk2OCIsInJvbGUiOiJnZW5lcmFsX3VzZXIiLCJpYXQiOjE3NDQwMzEwMDEsImV4cCI6MTc0NDAzNDYwMX0.ZsFqg5VGmDeH19p0Oynlp2-k8z2O8tQgPdhulY812GE	::ffff:127.0.0.1	curl/7.81.0	\N	2025-05-07 16:03:21.187+03	f	2025-04-07 15:03:21.189+02	2025-04-07 15:03:21.192+02
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

COPY public.users (id, first_name, last_name, username, email, role, bio, profile_image, gender, social_media, interested_categories, password, "createdAt", "updatedAt") FROM stdin;
27285eb6-09e7-4c70-a265-49fac2456f48	Ahmed	Ali	ahmedali	ahmed@example.com	general_user	\N	\N	\N	{}	[]	$2b$10$8wyMZJ2tnhhIMgC1sXvT6uIddvP5VlZZnG64Px562qvmHb6bMWEie	2025-03-29 00:50:10.909+02	2025-03-29 00:50:10.909+02
b3633c92-8528-4693-b652-c55c9ef6fd16	Hema	Atar	hemaatar	hemaatar636@gmail.com	general_user	\N	\N	\N	{}	[]	\N	2025-03-29 01:29:26.119+02	2025-03-29 01:29:26.119+02
e7964394-4f00-4109-a5b0-5555212a21e4	atar	hema	hemaatar1	ahmed1@example.com	general_user	\N	\N	\N	{}	[]	$2b$10$3GySNh5v2/356cPUVXX1Me.jyIUukW7e8n4f1F3L/PIYsMi7Xiaea	2025-03-29 05:53:50.224+02	2025-03-29 05:53:50.224+02
39523ae3-64c5-4c6d-846d-6c9a5fb0307b	Traveler	Bloggers	hemaatar5	hemaatar4@gmail.com	general_user	\N	\N	\N	{}	[]	\N	2025-03-29 09:17:46.757+02	2025-03-29 09:17:46.757+02
c2a321f6-d269-4f28-a114-58101431a259	Hema	Atar	heemaatar5	hemaatar7@gmail.com	general_user	\N	\N	\N	{}	[]	$2b$10$NI7bpFwaw6RcSppybagh0ue2J1eUGcuy2wJgMzrdraJQts7d.ZT9O	2025-03-30 05:57:39.317+02	2025-03-30 05:57:39.317+02
3b66d313-91b4-4b66-9091-ae9d83397968	hemaatar1	hemaatar1	hemaatar2	hemaatar1@gmail.com	general_user	\N	\N	\N	{}	[]	$2b$10$M56JqRzq4tb1MlsqO91CmuudobFJ7L939zBsYjooGPW81mYnk25q6	2025-04-07 15:00:24.055+02	2025-04-07 15:02:42.634+02
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
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: blogs blogs_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE;


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
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


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

