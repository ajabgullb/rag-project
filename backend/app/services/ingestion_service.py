from __future__ import annotations

import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Literal
from uuid import uuid4

from app.db.vector_db import ensure_index_fresh
from app.services.embedding_service import get_embeddings_model
from app.services.parsing_service import parse_doc
from app.utils.chuncking import create_chunk

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "app" / "data"

Stage = Literal["queued", "uploading", "parsing", "chunking", "indexing", "completed", "failed"]


@dataclass
class IngestionStatus:
  task_id: str
  file_name: str
  status: Stage
  progress: int
  message: str
  error: str | None = None


_tasks: dict[str, IngestionStatus] = {}
_lock = threading.Lock()


def _set_status(task_id: str, *, status: Stage, progress: int, message: str, error: str | None = None) -> None:
  with _lock:
    task = _tasks.get(task_id)
    if not task:
      return
    task.status = status
    task.progress = progress
    task.message = message
    task.error = error


def create_task(file_name: str) -> IngestionStatus:
  DATA_DIR.mkdir(parents=True, exist_ok=True)
  task = IngestionStatus(
    task_id=uuid4().hex,
    file_name=file_name,
    status="queued",
    progress=0,
    message="Queued for ingestion.",
  )
  with _lock:
    _tasks[task.task_id] = task
  return task


def get_task(task_id: str) -> IngestionStatus | None:
  with _lock:
    return _tasks.get(task_id)


def run_ingestion(task_id: str, file_name: str, mime_type: str | None) -> None:
  try:
    _set_status(task_id, status="uploading", progress=10, message="File stored successfully.")

    _set_status(task_id, status="parsing", progress=30, message="Parsing document content.")
    parsed_docs = parse_doc(file_name=file_name, mime_type=mime_type, tier="agentic_plus")

    _set_status(task_id, status="chunking", progress=60, message="Chunking parsed content.")
    _, unique_docs = create_chunk(parsed_docs)

    _set_status(task_id, status="indexing", progress=85, message="Embedding and indexing chunks.")
    embeddings = get_embeddings_model()
    ensure_index_fresh(unique_docs, embeddings)

    _set_status(task_id, status="completed", progress=100, message="Ingestion completed.")
  except Exception as exc:
    _set_status(
      task_id,
      status="failed",
      progress=100,
      message="Ingestion failed.",
      error=str(exc),
    )
