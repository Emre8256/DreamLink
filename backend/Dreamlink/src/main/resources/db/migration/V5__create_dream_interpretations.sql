CREATE TABLE dream_interpretations (
    id uuid NOT NULL,
    dream_id uuid NOT NULL,
    persona varchar(50) NOT NULL,
    content TEXT NOT NULL,
    zodiac_sign varchar(30) NOT NULL,
    created_at timestamp(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_dream_interpretations_dream FOREIGN KEY (dream_id) REFERENCES dreams (id),
    CONSTRAINT uk_dream_interpretations_dream_persona UNIQUE (dream_id, persona)
);

CREATE INDEX idx_dream_interpretations_dream ON dream_interpretations (dream_id);