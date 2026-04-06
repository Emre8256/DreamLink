-- IndexContract: Performance indexes for critical query paths
-- Target tables: dreams, comments, messages, notifications, follows, conversations
-- Indexes defined for FK lookups and temporal filtering

-- dreams: user_id FK lookup, created_at temporal filtering
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON dreams (user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON dreams (created_at);

-- comments: dream_id FK lookup, user_id FK lookup, created_at temporal
CREATE INDEX IF NOT EXISTS idx_comments_dream_id ON comments (dream_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at);

-- messages: conversation_id FK lookup, sender_id FK lookup, sent_at temporal, is_read status
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages (sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages (is_read);

-- notifications: recipient_user_id FK lookup, is_read status, created_at temporal, type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);

-- follows: follower_id FK lookup, following_id FK lookup, created_at temporal
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows (created_at);

-- conversations: user1_id FK lookup, user2_id FK lookup, last_message_at temporal
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations (user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations (user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (last_message_at);
