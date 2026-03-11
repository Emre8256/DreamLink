from __future__ import annotations

import asyncio
import json
import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib import error, request
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL")
MATCHER_BASE_URL = os.getenv("MATCHER_BASE_URL", "http://localhost:8000")
TARGET_USER_LABEL = "Gezgin"
DB_CONNECT_RETRIES = 3
DB_RETRY_DELAY_SECONDS = 1.5


@dataclass(frozen=True)
class SeedUser:
    label: str
    nickname: str
    email: str


@dataclass(frozen=True)
class SeedDream:
    user_label: str
    title: str
    description: str
    theme: str
    visibility: str = "PUBLIC"


def deterministic_uuid(scope: str, value: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"dream-link:{scope}:{value}")


def normalize_database_url(raw_url: str) -> str:
    url = raw_url.replace("@localhost:", "@127.0.0.1:")
    if "ssl=" in url and "sslmode=" not in url:
        # Convert async-style ssl flag to PostgreSQL sslmode for consistency.
        url = url.replace("ssl=true", "sslmode=require").replace("ssl=false", "sslmode=disable")
    elif "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=disable"
    return url


def to_asyncpg_url(url: str) -> str:
    parts = urlsplit(url)
    kept_query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k not in {"ssl", "sslmode"}]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(kept_query), parts.fragment))


USERS: list[SeedUser] = [
    SeedUser("Gezgin", "Gezgin", "gezgin.seed@dreamlink.local"),
    SeedUser("Melankolik", "Melankolik", "melankolik.seed@dreamlink.local"),
    SeedUser("Mistik", "Mistik", "mistik.seed@dreamlink.local"),
    SeedUser("Kabus-Goren", "Kabus-Goren", "kabus.seed@dreamlink.local"),
    SeedUser("Siradan-Biri", "Siradan-Biri", "siradan.seed@dreamlink.local"),
]

DREAMS: list[SeedDream] = [
    SeedDream(
        "Gezgin",
        "Bulutlarin Ustunde Tren",
        "Pas rengi bir tren, bulutlarin ustunde ray olmadan ilerliyordu. Her vagon farkli bir ulkeye aciliyor, kapilar kapanmadan once kokular degisiyordu. Son vagonda kendi cocuklugumu gordum ve inmek istemedim.",
        "EXCITED",
    ),
    SeedDream(
        "Gezgin",
        "Sessiz Liman Haritasi",
        "Ay isigi altinda limanda tek bir ses yoktu. Iskele tahtalarina tebezirle cizilmis bir harita buldum. Harita, denizde olmayan adalari gosteriyordu ve her adanin yaninda bir soru yaziyordu.",
        "CURIOUS",
    ),
    SeedDream(
        "Gezgin",
        "Sonu Gelmeyen Merdiven",
        "Antik bir kulede, duvarlar nefes aliyormus gibi inleyerek yukari uzaniyordu. Her katta baska bir dilde yazilar ve ayni yildizin sembolu vardi. Zirveye vardigimda kule denizin icindeydi.",
        "LUCID",
    ),
    SeedDream(
        "Melankolik",
        "Yagmurun Arka Odasi",
        "Eski bir evin arka odasinda yagmur tavandan degil, duvardan yagiyordu. Cekmecelerden eski mektuplar cikti; her birinde gonderilmemis vedalar vardi. Uyandigimda elimde kagit dokusu kalmisti.",
        "SAD",
    ),
    SeedDream(
        "Melankolik",
        "Kayip Konser",
        "Bos bir konser salonunda sadece piyano isik altindaydi. Tuglalardan gelen ezgi, tanidigim birinin sesine donusuyordu ama yuzunu secemiyordum. Son notada tum sandalyeler denize acti.",
        "LOVE",
    ),
    SeedDream(
        "Melankolik",
        "Golge Bahcesi",
        "Aksamustu bahcede cicekler degil golgeler buyuyordu. Her golgenin ortasinda bir hatira yankilaniyordu. Birine dokununca yillar onceki bir ozru tekrar duydum.",
        "SAD",
    ),
    SeedDream(
        "Mistik",
        "Yildiz Tozu Pazari",
        "Tas kemerlerin altinda kurulan bir gece pazarinda herkes kavanozla yildiz tozu satiyordu. Tezgahlarda adimi bilen bir saatci, zamani uc dakikaya bolup cebime koydu.",
        "CURIOUS",
    ),
    SeedDream(
        "Mistik",
        "Ayna Kuyusu",
        "Ormanin ortasindaki bir kuyuda su yerine ayna vardi. Yuzume baktikca arkada bilmedigim bir sehir beliriyordu. Sehirin kapisinda adim bir tasin ustune kazinmisti.",
        "LUCID",
    ),
    SeedDream(
        "Mistik",
        "Sessiz Kehanet",
        "Eski bir rasathanede teleskop gokyuzunu degil, icimi gosteriyordu. Her baktigimda ayni sembol tekrar etti: kesisen iki daire ve bir anahtar. Sabah olunca sembol avucumda belirdi.",
        "HAPPY",
    ),
    SeedDream(
        "Kabus-Goren",
        "Koridordaki Adimlar",
        "Hastane gibi kokan uzun bir koridorda lambalar tek tek sone sone ilerledim. Kapilarin arkasindan kendi sesim yardim istiyordu. Son kapida aynaya bakinca yuzum yoktu.",
        "NIGHTMARE",
    ),
    SeedDream(
        "Kabus-Goren",
        "Cam Ormani",
        "Camdan agaclarin oldugu bir ormanda ruzgar keskin sesler cikariyordu. Dallar kirildikca altindan saatler dusuyor ve ayni saniyeyi tekrar ediyordu.",
        "ANGRY",
    ),
    SeedDream(
        "Kabus-Goren",
        "Asansor 13",
        "Asansor her katta ayni kat numarasini gosteriyordu: 13. Kapilar her acildiginda cocuklugumdan bir oda cikiyor ama odanin penceresi disari degil bosluga bakiyordu.",
        "NIGHTMARE",
    ),
    SeedDream(
        "Siradan-Biri",
        "Mahalle Pazari",
        "Hafta sonu pazarda tum esnaf soyadimi biliyordu. Meyve kasalarinin altindan minik notlar cikti, hepsi gunluk hayata dair komik tavsiyeler yaziyordu.",
        "HAPPY",
    ),
    SeedDream(
        "Siradan-Biri",
        "Otobus Duragi",
        "Ayni durakta bekleyen insanlarin hepsi bir onceki gunun kiyafetini giymisti. Otobus geldiginde surucu bana sadece tek bir soru sordu: Bugun farkli ne yaptin?",
        "CURIOUS",
    ),
    SeedDream(
        "Siradan-Biri",
        "Gece Mesaisi",
        "Marketin gece mesaisinde raflar kendi kendine duzenleniyordu. Kasadan gecen urunlerin barkod sesleri ritme donustu ve tum market bir sarki soyledi.",
        "EXCITED",
    ),
]


def _http_call(method: str, url: str, payload: dict | None = None) -> tuple[int, dict]:
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url=url, method=method, data=data, headers=headers)
    try:
        with request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            return resp.getcode(), json.loads(body) if body else {}
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        parsed = {"error": body}
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            pass
        return exc.code, parsed


async def http_post(url: str) -> tuple[int, dict]:
    return await asyncio.to_thread(_http_call, "POST", url, None)


async def http_get(url: str) -> tuple[int, dict]:
    return await asyncio.to_thread(_http_call, "GET", url, None)


def print_table(rows: list[list[str]], headers: list[str]) -> None:
    all_rows = [headers] + rows
    widths = [max(len(str(row[i])) for row in all_rows) for i in range(len(headers))]

    def fmt(row: list[str]) -> str:
        return " | ".join(str(cell).ljust(widths[i]) for i, cell in enumerate(row))

    separator = "-+-".join("-" * w for w in widths)
    print(fmt(headers))
    print(separator)
    for row in rows:
        print(fmt(row))


async def seed_database() -> tuple[dict[str, uuid.UUID], dict[uuid.UUID, SeedDream]]:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is required. Example: postgresql+asyncpg://user:pass@host:5432/db")

    normalized_url = normalize_database_url(DATABASE_URL)
    async_url = to_asyncpg_url(normalized_url)
    last_error: Exception | None = None

    for attempt in range(1, DB_CONNECT_RETRIES + 1):
        engine = create_async_engine(async_url, echo=False, connect_args={"ssl": False})
        try:
            user_ids: dict[str, uuid.UUID] = {}
            dream_by_id: dict[uuid.UUID, SeedDream] = {}

            now = datetime.now(timezone.utc)

            async with engine.begin() as conn:
                for user in USERS:
                    user_id = deterministic_uuid("user", user.email)
                    user_ids[user.label] = user_id
                    await conn.execute(
                        text(
                            """
                            INSERT INTO users (
                                id, is_active, age, pp_url, bio, created_at, email, location,
                                nickname, password_hash, role, updated_at
                            ) VALUES (
                                :id, true, 30, NULL, NULL, :created_at, :email, NULL,
                                :nickname, :password_hash, 'USER', :updated_at
                            )
                            ON CONFLICT (id) DO UPDATE
                            SET nickname = EXCLUDED.nickname,
                                email = EXCLUDED.email,
                                password_hash = EXCLUDED.password_hash,
                                role = EXCLUDED.role,
                                updated_at = EXCLUDED.updated_at
                            """
                        ),
                        {
                            "id": user_id,
                            "created_at": now,
                            "updated_at": now,
                            "email": user.email,
                            "nickname": user.nickname,
                            "password_hash": "seeded_password_hash",
                        },
                    )

                for dream in DREAMS:
                    dream_id = deterministic_uuid("dream", f"{dream.user_label}:{dream.title}")
                    dream_by_id[dream_id] = dream
                    await conn.execute(
                        text(
                            """
                            INSERT INTO dreams (
                                id, comment_count, created_at, description, like_count,
                                theme, title, visibility, user_id, embedding
                            ) VALUES (
                                :id, 0, :created_at, :description, 0,
                                :theme, :title, :visibility, :user_id, NULL
                            )
                            ON CONFLICT (id) DO UPDATE
                            SET description = EXCLUDED.description,
                                theme = EXCLUDED.theme,
                                title = EXCLUDED.title,
                                visibility = EXCLUDED.visibility,
                                user_id = EXCLUDED.user_id,
                                embedding = NULL
                            """
                        ),
                        {
                            "id": dream_id,
                            "created_at": now,
                            "description": dream.description,
                            "theme": dream.theme,
                            "title": dream.title,
                            "visibility": dream.visibility,
                            "user_id": user_ids[dream.user_label],
                        },
                    )

                target_user_id = user_ids[TARGET_USER_LABEL]
                liked_candidate_labels = {"Mistik", "Siradan-Biri"}
                for dream_id, dream in dream_by_id.items():
                    if dream.user_label in liked_candidate_labels:
                        like_id = deterministic_uuid("like", f"{target_user_id}:{dream_id}:FEED")
                        await conn.execute(
                            text(
                                """
                                INSERT INTO dream_likes (
                                    id, created_at, source, dream_id, from_user_id, to_user_id
                                ) VALUES (
                                    :id, :created_at, 'FEED', :dream_id, :from_user_id, :to_user_id
                                )
                                ON CONFLICT (from_user_id, dream_id, source) DO NOTHING
                                """
                            ),
                            {
                                "id": like_id,
                                "created_at": now,
                                "dream_id": dream_id,
                                "from_user_id": target_user_id,
                                "to_user_id": user_ids[dream.user_label],
                            },
                        )

            await engine.dispose()
            return user_ids, dream_by_id
        except Exception as exc:
            last_error = exc
            await engine.dispose()
            if attempt < DB_CONNECT_RETRIES:
                print(
                    f"DB connection attempt {attempt}/{DB_CONNECT_RETRIES} failed: {exc}. "
                    f"Retrying in {DB_RETRY_DELAY_SECONDS}s..."
                )
                await asyncio.sleep(DB_RETRY_DELAY_SECONDS)
            else:
                break

    print(f"Async DB connection failed repeatedly ({last_error}), falling back to psycopg2 sync driver...")
    return await asyncio.to_thread(seed_database_sync_psycopg2, normalized_url)


def seed_database_sync_psycopg2(
    normalized_async_url: str,
) -> tuple[dict[str, uuid.UUID], dict[uuid.UUID, SeedDream]]:
    sync_url = normalized_async_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    if sync_url.startswith("postgresql://"):
        sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    engine = create_engine(sync_url, future=True)

    user_ids: dict[str, uuid.UUID] = {}
    dream_by_id: dict[uuid.UUID, SeedDream] = {}
    now = datetime.now(timezone.utc)

    with engine.begin() as conn:
        for user in USERS:
            user_id = deterministic_uuid("user", user.email)
            user_ids[user.label] = user_id
            conn.execute(
                text(
                    """
                    INSERT INTO users (
                        id, is_active, age, pp_url, bio, created_at, email, location,
                        nickname, password_hash, role, updated_at
                    ) VALUES (
                        :id, true, 30, NULL, NULL, :created_at, :email, NULL,
                        :nickname, :password_hash, 'USER', :updated_at
                    )
                    ON CONFLICT (id) DO UPDATE
                    SET nickname = EXCLUDED.nickname,
                        email = EXCLUDED.email,
                        password_hash = EXCLUDED.password_hash,
                        role = EXCLUDED.role,
                        updated_at = EXCLUDED.updated_at
                    """
                ),
                {
                    "id": user_id,
                    "created_at": now,
                    "updated_at": now,
                    "email": user.email,
                    "nickname": user.nickname,
                    "password_hash": "seeded_password_hash",
                },
            )

        for dream in DREAMS:
            dream_id = deterministic_uuid("dream", f"{dream.user_label}:{dream.title}")
            dream_by_id[dream_id] = dream
            conn.execute(
                text(
                    """
                    INSERT INTO dreams (
                        id, comment_count, created_at, description, like_count,
                        theme, title, visibility, user_id, embedding
                    ) VALUES (
                        :id, 0, :created_at, :description, 0,
                        :theme, :title, :visibility, :user_id, NULL
                    )
                    ON CONFLICT (id) DO UPDATE
                    SET description = EXCLUDED.description,
                        theme = EXCLUDED.theme,
                        title = EXCLUDED.title,
                        visibility = EXCLUDED.visibility,
                        user_id = EXCLUDED.user_id,
                        embedding = NULL
                    """
                ),
                {
                    "id": dream_id,
                    "created_at": now,
                    "description": dream.description,
                    "theme": dream.theme,
                    "title": dream.title,
                    "visibility": dream.visibility,
                    "user_id": user_ids[dream.user_label],
                },
            )

        target_user_id = user_ids[TARGET_USER_LABEL]
        liked_candidate_labels = {"Mistik", "Siradan-Biri"}
        for dream_id, dream in dream_by_id.items():
            if dream.user_label in liked_candidate_labels:
                like_id = deterministic_uuid("like", f"{target_user_id}:{dream_id}:FEED")
                conn.execute(
                    text(
                        """
                        INSERT INTO dream_likes (
                            id, created_at, source, dream_id, from_user_id, to_user_id
                        ) VALUES (
                            :id, :created_at, 'FEED', :dream_id, :from_user_id, :to_user_id
                        )
                        ON CONFLICT (from_user_id, dream_id, source) DO NOTHING
                        """
                    ),
                    {
                        "id": like_id,
                        "created_at": now,
                        "dream_id": dream_id,
                        "from_user_id": target_user_id,
                        "to_user_id": user_ids[dream.user_label],
                    },
                )

    engine.dispose()
    return user_ids, dream_by_id


async def process_all_dreams(dream_ids: list[uuid.UUID]) -> None:
    for dream_id in dream_ids:
        status, payload = await http_post(f"{MATCHER_BASE_URL}/process-dream/{dream_id}")
        if status >= 400:
            raise RuntimeError(f"process-dream failed for {dream_id}: HTTP {status} {payload}")


def calculate_relevance(matches: list[dict], dream_by_id: dict[uuid.UUID, SeedDream]) -> float:
    if not matches:
        return 0.0

    relevant_themes = {"EXCITED", "CURIOUS", "LUCID", "LOVE"}
    relevant = 0

    for match in matches:
        dream_id = uuid.UUID(match["dreamId"])
        seeded = dream_by_id.get(dream_id)
        if seeded and seeded.theme in relevant_themes:
            relevant += 1

    return round((relevant / len(matches)) * 100.0, 2)


async def fetch_and_print_matches(
    user_id: uuid.UUID,
    dream_by_id: dict[uuid.UUID, SeedDream],
) -> None:
    status, payload = await http_get(f"{MATCHER_BASE_URL}/get-matches/{user_id}?limit=10")
    if status >= 400:
        raise RuntimeError(f"get-matches failed: HTTP {status} {payload}")

    matches = payload.get("matches", [])
    rows: list[list[str]] = []
    for i, item in enumerate(matches, start=1):
        rows.append(
            [
                str(i),
                item.get("dreamId", ""),
                item.get("userId", ""),
                item.get("title", "")[:28],
                str(item.get("similarityPercent", "")),
                str(item.get("isHot", "")),
            ]
        )

    print("\n=== Match Results ===")
    print_table(
        rows,
        headers=["Rank", "Dream ID", "User ID", "Title", "Similarity %", "isHot"],
    )

    hot_count = sum(1 for item in matches if item.get("isHot") is True)
    relevance_pct = calculate_relevance(matches, dream_by_id)
    print(f"\nRelevance@{len(matches)}: %{relevance_pct}")
    print(f"Hot Match Count: {hot_count}")


def print_seed_texts() -> None:
    print("\n=== Seeded Dream Texts ===")
    for dream in DREAMS:
        print(f"- [{dream.user_label}] ({dream.theme}) {dream.title}: {dream.description}")


async def main() -> None:
    user_ids, dream_by_id = await seed_database()
    print("Seed data inserted/updated.")

    await process_all_dreams(list(dream_by_id.keys()))
    print("All dreams processed via /process-dream endpoint.")

    target_user_id = user_ids[TARGET_USER_LABEL]
    await fetch_and_print_matches(target_user_id, dream_by_id)
    print_seed_texts()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print("\nSeed test failed.")
        print(f"Reason: {exc}")
        print("Check DATABASE_URL, MATCHER_BASE_URL, and whether Postgres/FastAPI are reachable.")
        raise SystemExit(1)
