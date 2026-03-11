INSERT INTO users (
	id,
	email,
	nickname,
	password_hash,
	age,
	location,
	pp_url,
	bio,
	role,
	created_at,
	updated_at,
	is_active
) VALUES (
	'11111111-1111-1111-1111-111111111111',
	'smoke@example.com',
	'smoke_user',
	crypt('Passw0rd!', gen_salt('bf')),
	24,
	'Istanbul',
	NULL,
	'Seed user for smoke tests',
	'USER',
	now(),
	now(),
	true
) ON CONFLICT DO NOTHING;

INSERT INTO users (
	id,
	email,
	nickname,
	password_hash,
	age,
	location,
	pp_url,
	bio,
	role,
	created_at,
	updated_at,
	is_active
) VALUES (
	'22222222-2222-2222-2222-222222222222',
	'seed2@example.com',
	'seed_user2',
	crypt('Passw0rd!', gen_salt('bf')),
	26,
	'Ankara',
	NULL,
	'Second seed user',
	'USER',
	now(),
	now(),
	true
) ON CONFLICT DO NOTHING;

INSERT INTO dreams (
	id,
	user_id,
	title,
	description,
	theme,
	visibility,
	created_at,
	like_count,
	comment_count
) VALUES (
	'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
	'11111111-1111-1111-1111-111111111111',
	'Seed Dream One',
	'Seed dream for feed and discover',
	'HAPPY',
	'PUBLIC',
	now(),
	0,
	0
) ON CONFLICT DO NOTHING;

INSERT INTO dreams (
	id,
	user_id,
	title,
	description,
	theme,
	visibility,
	created_at,
	like_count,
	comment_count
) VALUES (
	'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
	'22222222-2222-2222-2222-222222222222',
	'Seed Dream Two',
	'Second seed dream for discover',
	'HAPPY',
	'PUBLIC',
	now(),
	0,
	0
) ON CONFLICT DO NOTHING;

INSERT INTO tags (
	id,
	name,
	description
) VALUES (
	'66666666-6666-6666-6666-666666666666',
	'seed',
	'Seed tag'
) ON CONFLICT DO NOTHING;

INSERT INTO dream_tags (
	dream_id,
	tag_id
) VALUES (
	'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
	'66666666-6666-6666-6666-666666666666'
) ON CONFLICT DO NOTHING;

INSERT INTO dream_matches (
	id,
	my_dream_id,
	matched_dream_id,
	my_user_id,
	similarity_score,
	period,
	matched_at
) VALUES (
	'77777777-7777-7777-7777-777777777777',
	'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
	'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
	'11111111-1111-1111-1111-111111111111',
	0.85,
	'HOT',
	now()
) ON CONFLICT DO NOTHING;

INSERT INTO conversations (
	id,
	user1_id,
	user2_id,
	created_at,
	last_message_at
) VALUES (
	'33333333-3333-3333-3333-333333333333',
	'11111111-1111-1111-1111-111111111111',
	'22222222-2222-2222-2222-222222222222',
	now(),
	now()
) ON CONFLICT DO NOTHING;

INSERT INTO messages (
	id,
	conversation_id,
	sender_id,
	content,
	is_read,
	sent_at
) VALUES (
	'44444444-4444-4444-4444-444444444444',
	'33333333-3333-3333-3333-333333333333',
	'22222222-2222-2222-2222-222222222222',
	'Hello from seed data',
	false,
	now()
) ON CONFLICT DO NOTHING;

INSERT INTO notifications (
	id,
	recipient_user_id,
	message,
	related_link,
	type,
	is_read,
	created_at
) VALUES (
	'55555555-5555-5555-5555-555555555555',
	'11111111-1111-1111-1111-111111111111',
	'Seed notification',
	'/dream/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
	'SYSTEM',
	false,
	now()
) ON CONFLICT DO NOTHING;
