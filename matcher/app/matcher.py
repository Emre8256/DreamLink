from __future__ import annotations

import math
import os
from pathlib import Path
from time import perf_counter

from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
MODEL_DIMENSION = 384
PREFERENCE_BOOST_WEIGHT = 0.2

# Keep model files in app/models so Docker image can preload and reuse cache.
MODEL_CACHE_DIR = Path(
    os.getenv(
        "ST_MODEL_CACHE_DIR",
        str(Path(__file__).resolve().parent / "models"),
    )
)
MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

_model = SentenceTransformer(MODEL_NAME, cache_folder=str(MODEL_CACHE_DIR))


def _vector_norm(vector: list[float]) -> float:
    return math.sqrt(sum(value * value for value in vector))


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    if len(vec_a) != len(vec_b):
        raise ValueError("Vector dimensions must match for cosine similarity.")

    norm_a = _vector_norm(vec_a)
    norm_b = _vector_norm(vec_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    return dot_product / (norm_a * norm_b)


def generate_embedding(text: str) -> list[float]:
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty.")

    embedding = _model.encode(text, normalize_embeddings=False)
    vector = embedding.tolist()

    if len(vector) != MODEL_DIMENSION:
        raise RuntimeError(f"Unexpected embedding size: {len(vector)}. Expected {MODEL_DIMENSION}.")
    return vector


def calculate_rrcn_lite_score(
    user_vector: list[float],
    candidate_vector: list[float],
    user_preference_vector: list[float] | None = None,
) -> float:
    if len(user_vector) != MODEL_DIMENSION or len(candidate_vector) != MODEL_DIMENSION:
        raise ValueError(f"user_vector and candidate_vector must be {MODEL_DIMENSION} dims.")

    dream_similarity = cosine_similarity(user_vector, candidate_vector)
    score = dream_similarity

    if user_preference_vector is not None:
        if len(user_preference_vector) != MODEL_DIMENSION:
            raise ValueError(f"user_preference_vector must be {MODEL_DIMENSION} dims.")

        reciprocal_alignment = cosine_similarity(user_preference_vector, candidate_vector)
        score = dream_similarity + (PREFERENCE_BOOST_WEIGHT * reciprocal_alignment)

    return score


def benchmark_embedding_generation(text: str) -> dict[str, float]:
    start = perf_counter()
    _ = generate_embedding(text)
    elapsed_seconds = perf_counter() - start

    return {
        "elapsed_seconds": elapsed_seconds,
        "elapsed_milliseconds": elapsed_seconds * 1000.0,
    }
