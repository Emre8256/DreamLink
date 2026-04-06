-- VectorIndexContract: HNSW ANN index for vector similarity search
-- Target table: dreams
-- Operator class: vector_cosine_ops (cosine similarity for dream embeddings)
-- HNSW parameters: m=16 (max connections per node), ef_construction=64 (search width during construction)
-- Dimension: vector(384) (sentence-transformers embedding dimension)
-- Purpose: Eliminate full table scans in matcher service vector similarity queries

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE dreams ADD COLUMN IF NOT EXISTS embedding vector(384);

CREATE INDEX IF NOT EXISTS idx_dreams_embedding_hnsw ON dreams USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
