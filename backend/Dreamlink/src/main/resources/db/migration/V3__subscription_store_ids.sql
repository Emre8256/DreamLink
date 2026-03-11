ALTER TABLE subscriptions
    ADD COLUMN product_id varchar(100),
    ADD COLUMN store_subscription_id varchar(120),
    ADD COLUMN store_transaction_id varchar(120);

CREATE INDEX IF NOT EXISTS idx_subscriptions_store_subscription_id
    ON subscriptions (store_subscription_id);
