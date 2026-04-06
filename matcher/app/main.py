from __future__ import annotations

import asyncio
import random

import traceback
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from .settings import settings
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from . import matcher
from .database import AsyncSessionLocal
from .models import Dream, User

app = FastAPI(title="Dream-Link AI Matcher", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8082", "http://127.0.0.1:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
    timeout=settings.openrouter_timeout_seconds,
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


def _get_trace_id(request: Request) -> str:
    trace_id = getattr(request.state, "trace_id", None)
    if isinstance(trace_id, str) and trace_id:
        return trace_id
    return str(uuid.uuid4())


def _build_error_payload(request: Request, status: int, error: str, message: str) -> PyApiErrorResponse:
    return PyApiErrorResponse(
        status=status,
        error=error,
        message=message,
        path=request.url.path,
        traceId=_get_trace_id(request),
    )


@app.middleware("http")
async def trace_id_middleware(request: Request, call_next):
    request.state.trace_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Trace-Id"] = request.state.trace_id
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    payload = _build_error_payload(request, exc.status_code, "HTTP_ERROR", detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=payload.model_dump(),
        headers={"X-Trace-Id": payload.traceId},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    print(f"UNHANDLED EXCEPTION: {exc}")
    traceback.print_exc()
    payload = _build_error_payload(
        request,
        500,
        "INTERNAL_SERVER_ERROR",
        "Beklenmeyen bir sunucu hatasi olustu",
    )
    return JSONResponse(
        status_code=500,
        content=payload.model_dump(),
        headers={"X-Trace-Id": payload.traceId},
    )


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
    contextDreams: list[str] = Field(default_factory=list)


class InterpretDreamResponse(BaseModel):
    persona: str
    zodiacSign: str
    content: str


class PyApiErrorResponse(BaseModel):
    status: int
    error: str
    message: str
    path: str
    traceId: str


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
    sql = text("""
        SELECT d.embedding
        FROM dream_likes dl
        JOIN dreams d ON d.id = dl.dream_id
        WHERE dl.from_user_id = :user_id
          AND d.embedding IS NOT NULL
        """)
    result = await session.execute(sql, {"user_id": user_id})
    vectors: list[list[float]] = []
    for row in result.all():
        vec = _coerce_vector(row[0])
        if vec is not None:
            vectors.append(vec)
    return vectors


async def _get_dream_with_retry(session: AsyncSession, dream_id: uuid.UUID) -> Dream | None:
    for attempt in range(settings.process_dream_retry_count + 1):
        result = await session.execute(select(Dream).where(Dream.id == dream_id).limit(1))
        dream = result.scalar_one_or_none()
        if dream is not None:
            return dream

        if attempt < settings.process_dream_retry_count:
            await asyncio.sleep(settings.process_dream_retry_delay_seconds)

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


def _sanitize_context_dreams(context_dreams: list[str]) -> list[str]:
    # Cap context size to keep prompt predictable.
    max_context_count = 3
    max_chars_per_item = 280
    sanitized: list[str] = []
    for item in context_dreams[:max_context_count]:
        clean = item.strip()
        if not clean:
            continue
        sanitized.append(clean[:max_chars_per_item])
    return sanitized


def _build_interpret_user_content(
    dream_text: str,
    persona: str,
    zodiac_sign: str,
    context_dreams: list[str],
) -> str:
    system_prompt = _build_system_prompt(persona, zodiac_sign)
    context_lines = _sanitize_context_dreams(context_dreams)
    context_block = "\n".join(f"- {line}" for line in context_lines)
    return (
        f"Sistem Talimati: {system_prompt}\n\n"
        f"Persona: {PERSONA_DISPLAY_NAME[persona]}\n"
        f"Burc: {zodiac_sign}\n"
        "Gorev: Asagidaki ruyayi secilen personanin perspektifinden yorumla. "
        "Yaniti sadece yorum metni olarak ver.\n\n"
        f"Gecmis Ruyalar Baglami:\n{context_block if context_block else '- Baglam yok'}\n\n"
        f"Ruya: {dream_text.strip()}"
    )


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


def _is_retryable_status(status_code: int | None) -> bool:
    return status_code in {429, 500, 502, 503, 504}


def _calculate_backoff_seconds(attempt_number: int) -> float:
    policy = settings.llm_retry_policy
    base_delay = policy.initial_delay_seconds * (policy.exponential_base ** max(0, attempt_number - 1))
    capped = min(base_delay, policy.max_delay_seconds)
    jitter = random.uniform(-policy.jitter_factor, policy.jitter_factor) * capped
    return max(0.0, capped + jitter)


def _request_openrouter_completion(user_content: str):
    return openrouter_client.chat.completions.create(
        extra_headers={
            "HTTP-Referer": settings.openrouter_site_url,
            "X-OpenRouter-Title": settings.openrouter_app_name,
        },
        extra_body={"reasoning": {"enabled": True}},
        model=settings.primary_model,
        messages=[
            {
                "role": "user",
                "content": user_content,
            }
        ],
    )


async def _generate_interpretation_with_llm(
    dream_text: str,
    persona: str,
    zodiac_sign: str,
    context_dreams: list[str],
) -> str:
    if not settings.openrouter_api_key:
        raise HTTPException(status_code=503, detail="settings.openrouter_api_key is missing")

    user_content = _build_interpret_user_content(dream_text, persona, zodiac_sign, context_dreams)
    attempts = max(1, settings.llm_retry_policy.max_attempts)

    for attempt in range(1, attempts + 1):
        try:
            completion = await asyncio.to_thread(_request_openrouter_completion, user_content)

            if not completion.choices:
                raise RuntimeError("Empty completion choices")

            raw_content = completion.choices[0].message.content
            content = _extract_content(raw_content)
            if not content:
                raise RuntimeError("Empty completion content")
            return content
        except Exception as exc:  # pragma: no cover - external API variability
            status_code = _extract_status_code(exc)
            retryable = _is_retryable_status(status_code)
            last_attempt = attempt >= attempts

            print(
                f"OPENROUTER HATASI [{settings.primary_model}] "
                f"attempt={attempt}/{attempts} status={status_code}: {str(exc)}"
            )

            if not last_attempt and retryable:
                delay_seconds = _calculate_backoff_seconds(attempt)
                await asyncio.sleep(delay_seconds)
                continue

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
        context_dreams = request.contextDreams or []

        if not dream_text:
            raise HTTPException(status_code=400, detail="dreamText cannot be empty")
        if not zodiac_sign:
            raise HTTPException(status_code=400, detail="zodiacSign cannot be empty")

        persona = _normalize_persona(request.persona)
        content = await _generate_interpretation_with_llm(
            dream_text=dream_text,
            persona=persona,
            zodiac_sign=zodiac_sign,
            context_dreams=context_dreams,
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
