from __future__ import annotations

import asyncio
import os
import traceback
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from . import matcher
from .database import AsyncSessionLocal
from .models import Dream, User

load_dotenv()

app = FastAPI(title="Dream-Link AI Matcher", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8082", "http://127.0.0.1:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROCESS_DREAM_RETRY_COUNT = int(os.getenv("PROCESS_DREAM_RETRY_COUNT", "6"))
PROCESS_DREAM_RETRY_DELAY_SECONDS = float(os.getenv("PROCESS_DREAM_RETRY_DELAY_SECONDS", "0.35"))

OPENROUTER_API_KEY = "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"
PRIMARY_MODEL = "qwen/qwen3.5-flash-02-23"
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "http://localhost")
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "Dream-Link Matcher")

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    timeout=60.0,
)

PERSONA_PROMPTS: dict[str, str] = {
    "FREUD": "Cevabi Turkce ver. Sen Sigmund Freud'sun. Ruyayi bastirilmis arzular ve cocukluk travmalari uzerinden analiz et. Dilin profesyonel ama sert olsun.",
    "JUNG": "Cevabi Turkce ver. Sen Carl Jung'sun. Ruyayi kolektif bilincalti, arketipler ve golge taraf uzerinden mistik bir dille analiz et.",
    "ASTROLOG": "Cevabi Turkce ver. Sen bilge bir Astrologsun. Kullanicinin [ZodiacSign] burcu oldugunu bilerek, ruyayi gezegen hareketleri ve kozmik enerjilerle yorumla.",
}

PERSONA_DISPLAY_NAME: dict[str, str] = {
    "FREUD": "Sigmund Freud",
    "JUNG": "Carl Jung",
    "ASTROLOG": "Astrolog",
}


class ProcessDreamResponse(BaseModel):
    dreamId: uuid.UUID
    embeddingDimension: int
    status: str


class MatchResultDTO(BaseModel):
    dreamId: uuid.UUID
    userId: uuid.UUID
    title: str
    description: str
    similarityPercent: float
    isHot: bool


class MatchListResponse(BaseModel):
    userId: uuid.UUID
    total: int
    matches: list[MatchResultDTO]


class InterpretDreamRequest(BaseModel):
    dreamText: str
    persona: str
    zodiacSign: str


class InterpretDreamResponse(BaseModel):
    persona: str
    zodiacSign: str
    content: str


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def _average_vectors(vectors: list[list[float]]) -> list[float] | None:
    if not vectors:
        return None

    dimension = len(vectors[0])
    sums = [0.0] * dimension

    for vec in vectors:
        if len(vec) != dimension:
            raise ValueError("Inconsistent vector dimensions detected.")
        for i, value in enumerate(vec):
            sums[i] += float(value)

    count = float(len(vectors))
    return [value / count for value in sums]


def _score_to_percent(score: float) -> float:
    normalized = ((score + 1.0) / 2.0) * 100.0
    return round(max(0.0, min(100.0, normalized)), 2)


def _coerce_vector(value: Any) -> list[float] | None:
    if value is None:
        return None
    if isinstance(value, list):
        return [float(x) for x in value]
    if isinstance(value, tuple):
        return [float(x) for x in value]
    if hasattr(value, "tolist"):
        converted = value.tolist()
        if isinstance(converted, list):
            return [float(x) for x in converted]
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            stripped = stripped[1:-1]
        if not stripped:
            return []
        return [float(part.strip()) for part in stripped.split(",") if part.strip()]
    raise ValueError(f"Unsupported vector type: {type(value).__name__}")


async def _fetch_user_dream_vectors(session: AsyncSession, user_id: uuid.UUID) -> list[list[float]]:
    stmt = select(Dream.embedding).where(
        Dream.user_id == user_id,
        Dream.embedding.is_not(None),
    )
    result = await session.execute(stmt)
    vectors: list[list[float]] = []
    for row in result.all():
        vec = _coerce_vector(row[0])
        if vec is not None:
            vectors.append(vec)
    return vectors


async def _fetch_user_preference_vectors(session: AsyncSession, user_id: uuid.UUID) -> list[list[float]]:
    sql = text(
        """
        SELECT d.embedding
        FROM dream_likes dl
        JOIN dreams d ON d.id = dl.dream_id
        WHERE dl.from_user_id = :user_id
          AND d.embedding IS NOT NULL
        """
    )
    result = await session.execute(sql, {"user_id": user_id})
    vectors: list[list[float]] = []
    for row in result.all():
        vec = _coerce_vector(row[0])
        if vec is not None:
            vectors.append(vec)
    return vectors


async def _get_dream_with_retry(session: AsyncSession, dream_id: uuid.UUID) -> Dream | None:
    for attempt in range(PROCESS_DREAM_RETRY_COUNT + 1):
        result = await session.execute(select(Dream).where(Dream.id == dream_id).limit(1))
        dream = result.scalar_one_or_none()
        if dream is not None:
            return dream

        if attempt < PROCESS_DREAM_RETRY_COUNT:
            await asyncio.sleep(PROCESS_DREAM_RETRY_DELAY_SECONDS)

    return None


def _normalize_persona(persona: str) -> str:
    value = persona.strip().upper()
    aliases = {
        "FREUD": "FREUD",
        "SIGMUND FREUD": "FREUD",
        "JUNG": "JUNG",
        "CARL JUNG": "JUNG",
        "ASTROLOG": "ASTROLOG",
        "ASTROLOGER": "ASTROLOG",
        "ASTROLOGIST": "ASTROLOG",
    }
    normalized = aliases.get(value)
    if normalized is None:
        raise HTTPException(status_code=400, detail="Unsupported persona")
    return normalized


def _extract_content(raw_content: Any) -> str:
    if isinstance(raw_content, str):
        return raw_content.strip()
    if isinstance(raw_content, list):
        parts: list[str] = []
        for part in raw_content:
            if isinstance(part, dict):
                text_part = part.get("text")
                if isinstance(text_part, str):
                    parts.append(text_part)
        return "\n".join(parts).strip()
    return ""


def _build_system_prompt(persona: str, zodiac_sign: str) -> str:
    template = PERSONA_PROMPTS[persona]
    return template.replace("[ZodiacSign]", zodiac_sign)


def _extract_status_code(exc: Exception) -> int | None:
    status_code = getattr(exc, "status_code", None)
    if isinstance(status_code, int):
        return status_code

    response = getattr(exc, "response", None)
    if response is not None:
        response_status = getattr(response, "status_code", None)
        if isinstance(response_status, int):
            return response_status

    return None


def _generate_interpretation_with_llm(dream_text: str, persona: str, zodiac_sign: str) -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=503, detail="OPENROUTER_API_KEY is missing")

    system_prompt = _build_system_prompt(persona, zodiac_sign)
    user_content = (
        f"Sistem Talimati: {system_prompt}\n\n"
        f"Persona: {PERSONA_DISPLAY_NAME[persona]}\n"
        f"Burc: {zodiac_sign}\n"
        "Gorev: Asagidaki ruyayi secilen personanin perspektifinden yorumla. "
        "Yaniti sadece yorum metni olarak ver.\n\n"
        f"Ruya: {dream_text.strip()}"
    )

    try:
        completion = openrouter_client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": OPENROUTER_SITE_URL,
                "X-OpenRouter-Title": OPENROUTER_APP_NAME,
            },
            extra_body={"reasoning": {"enabled": True}},
            model=PRIMARY_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": user_content,
                }
            ],
        )

        if not completion.choices:
            raise RuntimeError("Empty completion choices")

        raw_content = completion.choices[0].message.content
        if not isinstance(raw_content, str):
            raise RuntimeError("OpenRouter content is not a string")

        content = raw_content.strip()
        if not content:
            raise RuntimeError("Empty completion content")
        return content
    except Exception as exc:  # pragma: no cover - external API variability
        status_code = _extract_status_code(exc)
        print(f"OPENROUTER MODEL HATASI [{PRIMARY_MODEL}] status={status_code}: {str(exc)}")
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {exc}") from exc


@app.post("/process-dream/{dream_id}", response_model=ProcessDreamResponse)
async def process_dream(
    dream_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> ProcessDreamResponse:
    try:
        dream = await _get_dream_with_retry(session, dream_id)
        if dream is None:
            raise HTTPException(
                status_code=404,
                detail=("Dream not found after retry. " "It may not be committed yet or does not exist."),
            )

        source_text = f"{dream.title}\n{dream.description}".strip()
        vector = matcher.generate_embedding(source_text)

        dream.embedding = vector
        await session.commit()

        return ProcessDreamResponse(
            dreamId=dream.id,
            embeddingDimension=len(vector),
            status="processed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process dream: {exc}") from exc


@app.get("/get-matches/{user_id}", response_model=MatchListResponse)
async def get_matches(
    user_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
) -> MatchListResponse:
    try:
        user = await session.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        user_dream_vectors = await _fetch_user_dream_vectors(session, user_id)
        if not user_dream_vectors:
            raise HTTPException(status_code=404, detail="No embedded dreams found for user")

        user_vector = _average_vectors(user_dream_vectors)
        if user_vector is None:
            raise HTTPException(status_code=404, detail="No usable user vector found")

        preference_vectors = await _fetch_user_preference_vectors(session, user_id)
        preference_vector = _average_vectors(preference_vectors)

        candidate_limit = min(max(limit * 5, limit), 300)
        candidate_stmt = (
            select(
                Dream.id,
                Dream.user_id,
                Dream.title,
                Dream.description,
                Dream.embedding,
            )
            .where(
                Dream.user_id != user_id,
                Dream.embedding.is_not(None),
            )
            .order_by(Dream.embedding.cosine_distance(user_vector))
            .limit(candidate_limit)
        )
        candidate_result = await session.execute(candidate_stmt)
        candidates = candidate_result.all()

        ranked_matches: list[dict[str, Any]] = []
        for row in candidates:
            candidate_embedding = _coerce_vector(row.embedding)
            if candidate_embedding is None:
                continue

            score = matcher.calculate_rrcn_lite_score(
                user_vector=user_vector,
                candidate_vector=candidate_embedding,
                user_preference_vector=preference_vector,
            )

            similarity_percent = _score_to_percent(score)
            ranked_matches.append(
                {
                    "dreamId": row.id,
                    "userId": row.user_id,
                    "title": row.title,
                    "description": row.description,
                    "similarityPercent": similarity_percent,
                    "isHot": similarity_percent > 85.0,
                    "_score": score,
                }
            )

        ranked_matches.sort(key=lambda item: item["_score"], reverse=True)
        top_matches = ranked_matches[:limit]

        response_matches = [
            MatchResultDTO(
                dreamId=item["dreamId"],
                userId=item["userId"],
                title=item["title"],
                description=item["description"],
                similarityPercent=item["similarityPercent"],
                isHot=item["isHot"],
            )
            for item in top_matches
        ]

        return MatchListResponse(
            userId=user_id,
            total=len(response_matches),
            matches=response_matches,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to get matches: {exc}") from exc


@app.post("/interpret-dream", response_model=InterpretDreamResponse)
async def interpret_dream(request: InterpretDreamRequest) -> InterpretDreamResponse:
    try:
        dream_text = request.dreamText.strip()
        zodiac_sign = request.zodiacSign.strip()

        if not dream_text:
            raise HTTPException(status_code=400, detail="dreamText cannot be empty")
        if not zodiac_sign:
            raise HTTPException(status_code=400, detail="zodiacSign cannot be empty")

        persona = _normalize_persona(request.persona)
        content = _generate_interpretation_with_llm(
            dream_text=dream_text,
            persona=persona,
            zodiac_sign=zodiac_sign,
        )

        return InterpretDreamResponse(
            persona=persona,
            zodiacSign=zodiac_sign,
            content=content,
        )
    except Exception as e:
        print(f"OPENROUTER HATASI: {str(e)}")
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {e}") from e
