---
name: run-sprint
description: Dream-Link sprint'lerini otonom olarak çalıştırır. Tek sprint (1/2/3/4) veya tüm program (all) için kullan. Bağımlılıkları kontrol eder, uygun modele devreder, stuck protokolü uygular.
argument-hint: "[1|2|3|4|all]  örn: 1  veya  all"
disable-model-invocation: false
---

# Sprint Çalıştırma Protokolü

**Mod:** $ARGUMENTS
- Sayı (1/2/3/4) → sadece o sprint
- `all` veya boş → Sprint 1'den başla, tamamlananlardan sonra sırayla devam et

---

## BAĞIMLILIK HARİTASI (Non-Negotiable)

```
Sprint 1 (Survival)  →  Sprint 2 (Resilience)  →  Sprint 4 (AI)
Sprint 1 (Survival)  →  Sprint 3 (Payments)
Sprint 3 (Telemetry) →  Sprint 4 (AI Experiments)
```

Sprint N'i çalıştırmadan önce bağımlılıklarını kontrol et:
- Sprint 2 başlamadan önce: Sprint 1 kritik task'ları (SEC-01, SEC-02, SEC-03) DONE olmalı
- Sprint 3 başlamadan önce: Sprint 1 fully DONE olmalı
- Sprint 4 başlamadan önce: Sprint 2 DONE + Sprint 3 telemetry task'ları DONE olmalı

Bağımlılık karşılanmamışsa: sprint'i atla, log'a yaz, bir sonrakine bak.

---

## ADIM 1 — Başlangıç

**Önemli: microtasks.md'yi SADECE BU ADIMDA oku.** Sonraki task'larda yeniden okuma, çıkardığın listeyi kullan.
**Kullanıcıya soru sorma.** Belirsizlikte daha basit yolu seç, kararı logla, devam et.

microtasks.md'yi oku. Hangi sprint(ler) çalışacak, hangi task'lar var, mevcut BLOCKED task var mı — hepsini çıkar.

TodoWrite ile çalışacak sprint'lerin tüm task'larını `pending` olarak kaydet.

> Session koruma: Çalışmaya başlamadan önce terminale `/rename dream-sprint-$ARGUMENTS` yaz. Session çökerse `claude --resume` ile kaldığı yerden devam eder.

Özet bas:
```
=== PROGRAM BAŞLIYOR ===
Çalışacak sprint'ler: [liste]
Toplam task: X  (Haiku: A | Sonnet: B | Opus: C)
```

---

## ADIM 2 — Sprint Döngüsü

Her sprint için (sırayla):

### Sprint Başında
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT N BAŞLIYOR — [sprint adı]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
Context otomatik yönetilir (%75 auto-compact). Uzun okuma/araştırma işlerini subagent'a devret.

### Task Döngüsü (her task için)

```
[▶ TASK-ID | difficulty: X | model: Y]
```

**Difficulty 1–3 → task-simple subagent (haiku):**
Agent tool ile çağır. Prompt = microtasks.md'deki task XML + "Kök dizin: C:/octolabs/Dream-Link-main"

**Difficulty 5 → Ana session (Sonnet, orta thinking):**
Dosyaları oku, uygula, verification çalıştır.

**Difficulty 8–13 → task-complex subagent (opus):**
Agent tool ile çağır. Prompt = microtasks.md'deki task XML + "Kök dizin: C:/octolabs/Dream-Link-main"

### Her Task Sonrası

| Sonuç | Aksiyon |
|---|---|
| DONE | TodoWrite → completed · log: `✓ TASK-ID` |
| BLOCKED | Bir üst modele eskale et (aşağıdaki zincir) |

### Escalation Zinciri (her task için en fazla 1 kez)
```
Haiku BLOCKED  → Sonnet'te dene  → hâlâ BLOCKED → Opus'ta dene
Sonnet BLOCKED → Opus'ta dene
Opus BLOCKED   → BLOCKED-FINAL, sonraki task'a geç
```
- Üst model DONE dönerse: `✓ TASK-ID (escalated: haiku→sonnet)` logla
- Opus da BLOCKED dönerse: `✗ TASK-ID: BLOCKED-FINAL — <sebep>` logla, sonraki task
- Escalation bittikten sonra sıradaki task orijinal difficulty kuralıyla çalışır (model geri döner).

Context %75'te auto-compact olur. Subagent'a devret, ana session'da büyük okuma yapma.

### Sprint Özeti

```
=== SPRINT N TAMAMLANDI ===
✓ Done   : [listele]
✗ Blocked: [listele + tek satır sebep]
Kritik blocker var mı: [Evet/Hayır]
```

**Sonraki sprint kararı:**
- Kritik blocker YOKSA → bağımlılığı karşılanan bir sonraki sprint'e otomatik geç
- Kritik blocker VARSA (SEC-01/02/03 gibi güvenlik task'ı) → DUR, kullanıcıya bildir

---

## ADIM 3 — Program Sonu

Tüm sprint'ler tamamlandığında (veya `all` modunda son sprint bitince):

```
╔══════════════════════════════════════╗
║     DREAM-LINK PROGRAM TAMAMLANDI   ║
╠══════════════════════════════════════╣
║ Sprint 1: X/Y task done             ║
║ Sprint 2: X/Y task done             ║
║ Sprint 3: X/Y task done             ║
║ Sprint 4: X/Y task done             ║
╠══════════════════════════════════════╣
║ Kalan BLOCKED task'lar:             ║
║  [listele]                          ║
╠══════════════════════════════════════╣
║ Go/No-Go: [READY / NOT READY]       ║
╚══════════════════════════════════════╝
```

Go/No-Go kriterleri (sprints.md'den):
- permitAll yok, hardcoded secret yok, secure token lifecycle aktif
- Apple 5.1.1 hesap silme uçtan uca doğrulanmış
- Block/Report + EULA aktif
- UI'da dead button = 0
- Gerçek IAP sandbox'ta doğrulanmış
- pgvector ANN indeks migration'ı uygulanmış
