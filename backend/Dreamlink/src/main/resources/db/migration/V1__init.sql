CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id uuid NOT NULL,
    is_active boolean,
    age integer,
    pp_url varchar(255),
    bio varchar(500),
    created_at timestamp(6),
    email varchar(255) NOT NULL,
    location varchar(100),
    nickname varchar(50) NOT NULL,
    password_hash varchar(255) NOT NULL,
    role varchar(255) CHECK (role IN ('USER','ADMIN')),
    updated_at timestamp(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_nickname UNIQUE (nickname)
);

CREATE TABLE tags (
    id uuid NOT NULL,
    description varchar(500),
    name varchar(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_tags_name UNIQUE (name)
);

CREATE TABLE dreams (
    id uuid NOT NULL,
    comment_count integer NOT NULL,
    created_at timestamp(6),
    description TEXT NOT NULL,
    like_count integer NOT NULL,
    theme varchar(255) NOT NULL CHECK (theme IN ('HAPPY','SAD','NIGHTMARE','LOVE','LUCID','ANGRY','EXCITED','CURIOUS')),
    title varchar(100) NOT NULL,
    visibility varchar(255) NOT NULL CHECK (visibility IN ('PUBLIC','FOLLOWERS_ONLY','PRIVATE')),
    user_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_dreams_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE conversations (
    id uuid NOT NULL,
    created_at timestamp(6),
    last_message_at timestamp(6),
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_conversations_users UNIQUE (user1_id, user2_id),
    CONSTRAINT fk_conversations_user1 FOREIGN KEY (user1_id) REFERENCES users (id),
    CONSTRAINT fk_conversations_user2 FOREIGN KEY (user2_id) REFERENCES users (id)
);

CREATE TABLE follows (
    id uuid NOT NULL,
    created_at timestamp(6),
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_follows UNIQUE (follower_id, following_id),
    CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id),
    CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users (id)
);

CREATE TABLE dream_likes (
    id uuid NOT NULL,
    created_at timestamp(6),
    source varchar(255) NOT NULL CHECK (source IN ('FEED','DISCOVER')),
    dream_id uuid NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_dream_likes UNIQUE (from_user_id, dream_id, source),
    CONSTRAINT fk_dream_likes_dream FOREIGN KEY (dream_id) REFERENCES dreams (id),
    CONSTRAINT fk_dream_likes_from_user FOREIGN KEY (from_user_id) REFERENCES users (id),
    CONSTRAINT fk_dream_likes_to_user FOREIGN KEY (to_user_id) REFERENCES users (id)
);

CREATE INDEX idx_dream_likes_from_user ON dream_likes (from_user_id);
CREATE INDEX idx_dream_likes_to_user ON dream_likes (to_user_id);
CREATE INDEX idx_dream_likes_dream ON dream_likes (dream_id);

CREATE TABLE dream_matches (
    id uuid NOT NULL,
    matched_at timestamp(6),
    my_user_id uuid NOT NULL,
    period varchar(10) NOT NULL CHECK (period IN ('HOT','WEEK')),
    similarity_score float8 NOT NULL,
    matched_dream_id uuid NOT NULL,
    my_dream_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_dream_matches UNIQUE (my_dream_id, matched_dream_id),
    CONSTRAINT fk_dream_matches_matched FOREIGN KEY (matched_dream_id) REFERENCES dreams (id),
    CONSTRAINT fk_dream_matches_mine FOREIGN KEY (my_dream_id) REFERENCES dreams (id)
);

CREATE INDEX idx_dream_matches_my_dream ON dream_matches (my_dream_id);
CREATE INDEX idx_dream_matches_matched_dream ON dream_matches (matched_dream_id);
CREATE INDEX idx_dream_matches_my_user ON dream_matches (my_user_id);

CREATE TABLE dream_tags (
    dream_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    CONSTRAINT fk_dream_tags_dream FOREIGN KEY (dream_id) REFERENCES dreams (id),
    CONSTRAINT fk_dream_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
);

CREATE TABLE comments (
    id uuid NOT NULL,
    content TEXT NOT NULL,
    created_at timestamp(6),
    dream_id uuid NOT NULL,
    user_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_comments_dream FOREIGN KEY (dream_id) REFERENCES dreams (id),
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE messages (
    id uuid NOT NULL,
    content TEXT NOT NULL,
    is_read boolean,
    sent_at timestamp(6),
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id),
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id)
);

CREATE TABLE notifications (
    id uuid NOT NULL,
    created_at timestamp(6),
    is_read boolean,
    message varchar(255) NOT NULL,
    related_link varchar(255),
    type varchar(255) CHECK (type IN ('LIKE','COMMENT','MATCH_FOUND','SYSTEM','FOLLOW')),
    recipient_user_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id)
);
