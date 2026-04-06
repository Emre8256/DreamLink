-- Webhook events contract for store-native deduplication.
-- WebhookEventRecord: store, event_id, event_type, payload_hash, status, processed_at

CREATE TABLE IF NOT EXISTS webhook_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    store varchar(20) NOT NULL,
    event_id varchar(191) NOT NULL,
    event_type varchar(120) NOT NULL,
    payload_hash varchar(64) NOT NULL,
    status varchar(20) NOT NULL,
    processed_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_webhook_events PRIMARY KEY (id),
    CONSTRAINT uk_webhook_events_store_event UNIQUE (store, event_id),
    CONSTRAINT ck_webhook_events_status CHECK (status IN ('PROCESSED', 'SKIPPED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events (processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_store ON webhook_events (store);

CREATE UNIQUE INDEX IF NOT EXISTS uk_subscriptions_store_transaction_id
    ON subscriptions (store_transaction_id)
    WHERE store_transaction_id IS NOT NULL;
