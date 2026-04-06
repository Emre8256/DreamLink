# Dream-Link Autonomous Development Protocol (V1.0)

## 1. Project Context & Vision
- **Goal:** An AI-powered dream interpretation and social matching platform (Dream-Link).
- **Core Value:** Analytical psychology (Jung/Freud) meets high-performance vector matching.
- **Critical Status:** Current state is NO-GO (Security/Performance/Legal risks). Sprint goal is Production-Readiness.

## 2. Technical Stack & Standards
### Backend (Java/Spring Boot)
- **Architecture:** Controller -> Service -> Repository -> Entity.
- **Language:** Java 21+, Spring Boot 3.4+.
- **Standards:** - Use **Lombok** to reduce boilerplate.
  - Use **Java Records** for DTOs.
  - Mandatory **Validation** (@Valid) for all input DTOs.
  - **Transaction Management:** Service level `@Transactional` is mandatory for state-changing operations.

### Matcher (Python/FastAPI)
- **Engine:** FastAPI + pgvector (PostgreSQL).
- **Standards:** - **Type Hinting:** Mandatory for all function signatures.
  - **Pydantic V2:** Use for request/response schemas.
  - **Vector Ops:** Always offload similarity search to DB using pgvector ANN indices (HNSW). No in-memory full sorting.

### Frontend (React Native/Expo)
- **Navigation:** Expo Router.
- **State:** Zustand (Store-first for data, Local-state for UI only).
- **Security:** Use `expo-secure-store` for JWT. NO `AsyncStorage` for sensitive data.

## 3. Autonomous Operating Procedures (AOP)
### Code Generation & Refactoring
- **Contract-First:** Define Interfaces/DTOs/DB Schema BEFORE implementing logic.
- **Dead Code Policy:** DELETE unused code, functions, and files immediately. DO NOT comment them out. Cleanliness is priority.
- **Consistency:** Maintain existing naming conventions (camelCase for Java/TS, snake_case for Python/DB).

### Memory & Token Management
- **Context:** Auto-compact at 75% threshold handles memory. Delegate heavy reads to subagents.
- **Efficiency:** Read only necessary files. If a task involves a Service, read the Controller and Entity/Repository first to understand the contract.

## 4. Verification & Defense
- **Pre-Commit Check:** Run the specific `<verification>` command provided in `microtasks.md` after every single code change.
- **Fail-then-Skip:** If verification fails, apply ONE targeted fix and retry ONCE. Still failing → mark BLOCKED and move to next task. Never loop.
- **Timeout & Retry:** All external calls (OpenRouter, Apple/Google APIs) must have explicit timeouts (3s/5s) and exponential backoff retry logic.

## 5. Critical Constraints (Non-Negotiable)
- **Security:** NEVER use `permitAll()` in SecurityConfig for production routes.
- **Database:** NO N+1 queries. Use `@EntityGraph` or `JOIN FETCH` for relations.
- **Privacy:** Implement physical deletion (Cascade) for Account Deletion (Apple 5.1.1 compliance).
  
- Basit dosya okuma ve lint hatalarında düşük thinking budget kullan, mimari ve güvenlik task'larında thinking budget'ı maksimuma çıkar

## 6. Autonomous Behavior Rules (Non-Negotiable)

### Soru Sormama Kuralı
- Otonom çalışma sırasında kullanıcıya ASLA soru sorma.
- Belirsizlik varsa: daha basit/güvenli yaklaşımı seç, kararı log'a yaz, devam et.
- Gerçekten devam edilemiyorsa: BLOCKED yaz, sonraki task'a geç.

### Verification Dürüstlüğü
- Verification komutunu ASLA çalıştırmadan DONE yazma.
- Komutun gerçek terminal çıktısını gör, sonra karar ver.
- Derleme hatası yoksa ama logic yanlışsa → yine de BLOCKED yaz.

### Veritabanı Migration Güvenliği
- Flyway migration dosyaları (V*.sql) geri alınamaz. Yazarken dikkat et.
- Verification: sadece `clean compile` — migration'ı gerçek DB'ye uygulama, Flyway uygulayacak.
- Migration'da veri kaybı riski varsa (DROP, CASCADE DELETE) bunu BLOCKED-FINAL logla, atla.

### Token Verimliliği (Anti-İsraf Kuralları)
- microtasks.md'yi session başında BİR KEZ oku, tüm task listesini çıkar. Her task için yeniden okuma.
- Subagent'a devredilen task'larda ana session dosya okuma yapma — subagent halleder.
- Geniş kod tabanı araştırması gerekiyorsa Explore subagent kullan.
- **Dosya okuma sıralaması:** Önce `Grep` ile bul, sonra sadece ilgili satırları `Read` ile oku (offset+limit). Tüm dosyayı okuma.
- **Aynı dosyayı task içinde 2 kez okuma.** Zaten okuduğunu bellekte tut.
- **Büyük dosyalarda** (>500 satır) tüm içeriği okuma; sadece ilgili bölümü oku.
- **Verification çıktısı uzunsa** ilk 30 satır yeterli — tüm stack trace'i okuma.
- **Yanıt uzunluğunu kıs:** Kod yaz, açıklama yazma. Özet yazma, sadece sonucu logla.

## 7. Autonomous Task Execution Protocol (AEP)

### Task Source & Status
- **Backlog:** `microtasks.md` (tüm `###` başlıkları birer task ID'dir)
- **Status Tracking:** Her task için `TodoWrite` kullan: pending → in_progress → done | blocked

### Execution Loop
Her task için sırayla:
1. `TodoWrite` → `in_progress`
2. Yalnızca `<context>` listesindeki dosyaları oku
3. `<task>` adımlarını sırayla uygula
4. `<verification>` komutunu **birebir** çalıştır
5. PASS → `TodoWrite` done, sonraki task'a geç
6. FAIL → Hatayı analiz et, **tek** hedefli düzeltme yap, bir kez daha çalıştır
7. FAIL tekrar → `TodoWrite` blocked: `[BLOCKED: <tek satır hata özeti>]`, sonraki task'a geç

**Kural (Non-Negotiable):** Aynı düzeltmeyi ikiden fazla deneME. Asla döngüye girme.

### Context Yönetimi (Otonom)
- Auto-compact %75 eşiğinde otomatik devreye girer. Manuel compact gerekmez.
- Uzun dosya okumalarını ve araştırmaları subagent'a devret (ana context'i temiz tut).
- Her difficulty-8+ task öncesi mümkünse subagent kullan.

### Sprint Sırası
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 (microtasks.md sırası)
Karşılanmamış bağımlılığı olan task'ı atla, sonuna ekle.

## 8. Model Delegation Rules

| Task Difficulty | Yaklaşım |
|---|---|
| 1–3 | `task-simple` subagent ile devret (haiku model) |
| 5 | Ana session'da çalıştır, orta thinking budget |
| 8–13 | `task-complex` subagent ile devret (opus model) |

**Subagent spawn:** Agent tool kullanarak microtasks.md'deki task XML'ini prompt'a ekle.

### Stuck Escalation Zinciri (otomatik model yükseltme)
```
Haiku BLOCKED → Sonnet'te dene → BLOCKED → Opus'ta dene → BLOCKED → kaydet, geç
```
- Her eskalasyonda aynı task XML'ini bir üst modele gönder.
- Opus da BLOCKED dönerse: TodoWrite'a `BLOCKED-FINAL` yaz, sonraki task'a geç.
- Task bitince (DONE veya BLOCKED-FINAL) model otomatik olarak task'ın orijinal seviyesine döner.
- Bu zincir her task için en fazla 1 kez çalışır. Aynı task'ı 2 kez eskale etme.