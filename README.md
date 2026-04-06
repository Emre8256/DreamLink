# Dream-Link Calistirma Rehberi (TR)

Bu dokuman, projeyi yeni bir bilgisayarda sorunsuz calistirmak icin gerekli adimlari listeler.

## Gereksinimler
- Docker Desktop (calisir durumda)
- Node.js 20+ ve npm
- (Opsiyonel) Git

## Hizli Baslatma (Docker: backend + matcher + db)
1) .env.example dosyasini .env olarak kopyala.
2) .env icinde OPENROUTER_API_KEY degerini set et.
3) Komut:
   docker compose up -d --build
4) Loglari kontrol et:
   docker compose logs -f backend ai-matcher

Servisler:
- Backend: http://localhost:8080
- Matcher: http://localhost:8000
- Postgres: localhost:5432 (db: dreamlink / user: dreamlink / pass: change_me)

## Frontend (Expo)
1) frontend/dreamlink-app dizinine gir.
2) .env.example dosyasini .env olarak kopyala.
3) EXPO_PUBLIC_API_BASE_URL degiskenini kontrol et:
   http://localhost:8080/api
4) Komutlar:
   npm install
   npm run start

Not: Web icin istersen npm run web kullanabilirsin.

## Veritabani Notlari
- Flyway migration otomatik calisir (pgvector dahil).
- Veriyi temizlemek icin reset_db.sql dosyasini bir SQL client ile calistir.
- Tam sifirlama icin:
  docker compose down -v

## Baska Bilgisayara Tasima
1) Reponun tamamini kopyala.
2) Docker Desktop kur ve acik oldugundan emin ol.
3) .env dosyasini olustur ve OPENROUTER_API_KEY set et.
4) docker compose up -d --build
5) Frontend icin yukaridaki Expo adimlarini uygula.
