from __future__ import annotations

import asyncio
import os
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

PROCESS_DREAM_RETRY_COUNT = int(os.getenv("PROCESS_DREAM_RETRY_COUNT", "6"))
PROCESS_DREAM_RETRY_DELAY_SECONDS = float(os.getenv("PROCESS_DREAM_RETRY_DELAY_SECONDS", "0.35"))


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
