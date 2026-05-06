"""
Pinecone-backed vector store. Embeddings are computed locally (Ollama); only vectors + metadata live in Pinecone.
"""

from __future__ import annotations

import hashlib
import time
from pathlib import Path

from langchain_core.documents import Document
from pinecone import Pinecone, ServerlessSpec
from pinecone.exceptions import NotFoundException

from app.core.config import (
  get_pinecone_embedding_dimension,
  get_pinecone_index_name,
  get_pinecone_namespace,
  get_pinecone_serverless_cloud,
  get_pinecone_serverless_region,
  require_pinecone_api_key,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = PROJECT_ROOT / "app" / "db" / ".pinecone_manifest"
UPSERT_BATCH = 100
POST_UPSERT_SLEEP_SEC = 10


def _chunks_fingerprint(docs: list[Document]) -> str:
  ids = sorted(str(d.metadata.get("chunk_id", "")) for d in docs)
  raw = "|".join(ids).encode("utf-8")
  return hashlib.sha256(raw).hexdigest()


def _read_manifest() -> str | None:
  if not MANIFEST_PATH.is_file():
    return None
  return MANIFEST_PATH.read_text(encoding="utf-8").strip() or None


def _write_manifest(fingerprint: str) -> None:
  MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
  MANIFEST_PATH.write_text(fingerprint, encoding="utf-8")


def _get_client() -> Pinecone:
  return Pinecone(api_key=require_pinecone_api_key())


def _ensure_index(pc: Pinecone) -> None:
  name = get_pinecone_index_name()
  dimension = get_pinecone_embedding_dimension()
  if pc.has_index(name):
    return
  pc.create_index(
    name=name,
    dimension=dimension,
    metric="cosine",
    spec=ServerlessSpec(
      cloud=get_pinecone_serverless_cloud(),
      region=get_pinecone_serverless_region(),
    ),
    timeout=120,
  )


def _assert_index_dimension(pc: Pinecone) -> None:
  """Dense index dimension must match local embedding vectors."""

  name = get_pinecone_index_name()
  expected = get_pinecone_embedding_dimension()
  desc = pc.describe_index(name)
  actual = desc.dimension
  if actual is not None and actual != expected:
    raise ValueError(
      f"Pinecone index {name!r} has dimension {actual}, but embeddings are configured for "
      f"{expected}. Use a matching index, set PINECONE_EMBEDDING_DIMENSION, or change "
      "app.services.embedding_service.EMBEDDING_MODEL / EMBEDDING_DIMENSION."
    )


def _get_index(pc: Pinecone):
  _ensure_index(pc)
  _assert_index_dimension(pc)
  return pc.Index(get_pinecone_index_name())


def _namespace_vector_count(index, namespace: str) -> int:
  stats = index.describe_index_stats()
  ns_map = stats.namespaces or {}
  summary = ns_map.get(namespace)
  if summary is None:
    return 0
  vc = getattr(summary, "vector_count", None)
  if vc is not None:
    return int(vc)
  if isinstance(summary, dict):
    return int(summary.get("vector_count", 0))
  return 0


def _sync_vectors(index, docs: list[Document], embeddings) -> None:
  if not docs:
    return

  namespace = get_pinecone_namespace()
  texts = [d.page_content for d in docs]
  vectors_list = embeddings.embed_documents(texts)
  if not vectors_list:
    return
  dim = len(vectors_list[0])
  expected = get_pinecone_embedding_dimension()
  if dim != expected:
    raise ValueError(
      f"Embedding dimension {dim} does not match PINECONE_EMBEDDING_DIMENSION={expected}. "
      "Recreate the index with the correct dimension or fix the embedding model."
    )

  try:
    index.delete(delete_all=True, namespace=namespace)
  except NotFoundException:
    # Namespace has never existed or is already empty — safe to continue.
    pass

  upsert_payload = []
  for doc, values in zip(docs, vectors_list, strict=True):
    chunk_id = str(doc.metadata.get("chunk_id", ""))
    if not chunk_id:
      continue
    page_number = doc.metadata.get("page_number")
    meta: dict = {
      "content": doc.page_content,
      "chunk_id": chunk_id,
      "page_number": int(page_number) if page_number is not None else -1,
    }
    upsert_payload.append({"id": chunk_id, "values": values, "metadata": meta})

  for i in range(0, len(upsert_payload), UPSERT_BATCH):
    batch = upsert_payload[i : i + UPSERT_BATCH]
    index.upsert(vectors=batch, namespace=namespace, show_progress=False)

  time.sleep(POST_UPSERT_SLEEP_SEC)


def ensure_index_fresh(docs: list[Document], embeddings) -> None:
  """Create the Pinecone index if needed and upsert when chunk set changes."""

  fingerprint = _chunks_fingerprint(docs)
  pc = _get_client()
  index = _get_index(pc)
  namespace = get_pinecone_namespace()

  manifest_matches = _read_manifest() == fingerprint
  remote_populated = _namespace_vector_count(index, namespace) > 0

  if manifest_matches and remote_populated:
    return

  _sync_vectors(index, docs, embeddings)
  _write_manifest(fingerprint)


def similarity_search_with_score(
  query: str,
  embeddings,
  k: int = 10,
) -> list[tuple[Document, float]]:
  """Query Pinecone with a text embedding; returns LangChain Documents with cosine similarity scores."""

  if k < 1:
    raise ValueError("k must be at least 1")

  q_vec = embeddings.embed_query(query)
  pc = _get_client()
  index = _get_index(pc)
  namespace = get_pinecone_namespace()

  top_k = max(k, 2)
  response = index.query(
    vector=q_vec,
    top_k=top_k,
    namespace=namespace,
    include_metadata=True,
  )

  pairs: list[tuple[Document, float]] = []
  for match in response.matches:
    meta = match.metadata or {}
    text = meta.get("content")
    if not text:
      continue
    chunk_id = str(meta.get("chunk_id", match.id))
    page_raw = meta.get("page_number", -1)
    try:
      page_number = int(page_raw) if page_raw is not None else -1
    except (TypeError, ValueError):
      page_number = -1

    doc = Document(
      page_content=str(text),
      metadata={
        "chunk_id": chunk_id,
        "page_number": page_number if page_number >= 0 else "unknown",
      },
    )
    score = float(match.score) if match.score is not None else 0.0
    pairs.append((doc, score))

  return pairs[:k]
