-- Vektör desteğini aktif et
CREATE EXTENSION IF NOT EXISTS vector;

-- Sadece gerekli sütun
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Admin kullanıcısı (Şifre: admin123)
-- Not: Spring Security BCrypt kullandığı için hash'lenmiş hali budur.
INSERT INTO users (id, nickname, email, password_hash, role, age, is_active, created_at)
VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@dreamlink.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOn2', 'ADMIN', 30, true, now())
ON CONFLICT (email) DO NOTHING;