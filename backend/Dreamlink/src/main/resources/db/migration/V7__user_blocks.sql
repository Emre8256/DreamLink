CREATE TABLE user_blocks (
    id uuid NOT NULL,
    blocker_user_id uuid NOT NULL,
    blocked_user_id uuid NOT NULL,
    created_at timestamp(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_user_blocks_relationship UNIQUE (blocker_user_id, blocked_user_id),
    CONSTRAINT fk_user_blocks_blocker FOREIGN KEY (blocker_user_id) REFERENCES users (id),
    CONSTRAINT fk_user_blocks_blocked FOREIGN KEY (blocked_user_id) REFERENCES users (id),
    CONSTRAINT ck_user_blocks_no_self_block CHECK (blocker_user_id != blocked_user_id)
);

CREATE INDEX idx_user_blocks_blocker ON user_blocks (blocker_user_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks (blocked_user_id);
