-- Delete everything except users (PostgreSQL).
-- Run this in a SQL client.

BEGIN;

TRUNCATE TABLE
	dream_tags,
	dream_matches,
	dream_likes,
	messages,
	comments,
	conversations,
	tags,
	dreams
RESTART IDENTITY CASCADE;

COMMIT;

SELECT 'cleanup_done' AS status;
