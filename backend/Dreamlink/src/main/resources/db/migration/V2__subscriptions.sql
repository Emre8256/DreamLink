CREATE TABLE subscriptions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    plan_tier varchar(20) NOT NULL CHECK (plan_tier IN ('FREE','PLUS','GOLD','PLATINUM')),
    status varchar(20) NOT NULL CHECK (status IN ('ACTIVE','CANCELED','EXPIRED','TRIAL')),
    store varchar(20) NOT NULL CHECK (store IN ('APP_STORE','PLAY_STORE','STRIPE','MANUAL')),
    expires_at timestamp(6),
    current_period_end timestamp(6),
    created_at timestamp(6),
    updated_at timestamp(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_subscriptions_user UNIQUE (user_id),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id)
);
