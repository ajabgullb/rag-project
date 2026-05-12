from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from app.models.request_models import RagPromptRequest
from app.models.response_models import RagPromptResponse
from app.services.ingestion_service import create_task, get_task, run_ingestion
from app.services.rag_service import generate_response

from app.agents.graph import app as rag_app

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[4]
DATA_DIR = PROJECT_ROOT / "app" / "data"
TOKEN_SECRET = os.getenv("AUTH_SECRET", "dev-secret-change-me")
TOKEN_EXPIRY_SEC = 60 * 60 * 12
users: dict[str, dict[str, str]] = {}


class AuthRequest(BaseModel):
  email: EmailStr
  password: str = Field(..., min_length=6, max_length=128)
  full_name: str | None = Field(default=None, max_length=120)


class AuthResponse(BaseModel):
  token: str
  user_name: str
  user_email: str


class IngestionCreateResponse(BaseModel):
  task_id: str
  file_name: str
  status: str
  progress: int
  message: str


class IngestionStatusResponse(BaseModel):
  task_id: str
  file_name: str
  status: str
  progress: int
  message: str
  error: str | None = None


def _hash_password(password: str, email: str) -> str:
  return hashlib.sha256(f"{email}:{password}".encode("utf-8")).hexdigest()


def _encode_token(payload: dict) -> str:
  raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
  encoded = base64.urlsafe_b64encode(raw).decode("utf-8")
  sig = hmac.new(TOKEN_SECRET.encode("utf-8"), encoded.encode("utf-8"), hashlib.sha256).hexdigest()
  return f"{encoded}.{sig}"


def _decode_token(token: str) -> dict:
  try:
    encoded, signature = token.split(".", 1)
  except ValueError as exc:
    raise HTTPException(status_code=401, detail="Invalid token format.") from exc

  expected_sig = hmac.new(TOKEN_SECRET.encode("utf-8"), encoded.encode("utf-8"), hashlib.sha256).hexdigest()
  if not hmac.compare_digest(signature, expected_sig):
    raise HTTPException(status_code=401, detail="Invalid token signature.")

  payload_raw = base64.urlsafe_b64decode(encoded.encode("utf-8"))
  payload = json.loads(payload_raw.decode("utf-8"))
  exp = int(payload.get("exp", 0))
  if exp < int(time.time()):
    raise HTTPException(status_code=401, detail="Token has expired.")
  return payload


def _require_auth(authorization: str | None) -> dict:
  if not authorization or not authorization.startswith("Bearer "):
    raise HTTPException(status_code=401, detail="Missing bearer token.")
  token = authorization.split(" ", 1)[1]
  return _decode_token(token)


@app.post("/auth/signup", response_model=AuthResponse)
async def signup(body: AuthRequest) -> AuthResponse:
  key = body.email.lower()
  if key in users:
    raise HTTPException(status_code=409, detail="Account already exists.")

  user_name = body.full_name or key.split("@")[0]
  users[key] = {
    "email": key,
    "name": user_name,
    "password_hash": _hash_password(body.password, key),
  }

  token = _encode_token({"sub": key, "name": user_name, "exp": int(time.time()) + TOKEN_EXPIRY_SEC})
  return AuthResponse(token=token, user_name=user_name, user_email=key)


@app.post("/auth/login", response_model=AuthResponse)
async def login(body: AuthRequest) -> AuthResponse:
  key = body.email.lower()
  account = users.get(key)
  if not account:
    raise HTTPException(status_code=401, detail="Invalid email or password.")

  if account["password_hash"] != _hash_password(body.password, key):
    raise HTTPException(status_code=401, detail="Invalid email or password.")

  token = _encode_token({"sub": key, "name": account["name"], "exp": int(time.time()) + TOKEN_EXPIRY_SEC})
  return AuthResponse(token=token, user_name=account["name"], user_email=key)


@app.post("/query", response_model=RagPromptResponse)
async def query(body: RagPromptRequest, authorization: str | None = Header(default=None)) -> RagPromptResponse:
  _require_auth(authorization)

  result = await rag_app.ainvoke(
    {
      "query": body.prompt,
      "docs": [],
      "rewrite_count": 3,
      "web_search_needed": False,
      "generation": "",
      "response": ""
    }
  )

  return RagPromptResponse(response=result["response"])


@app.post("/ingestion/upload", response_model=IngestionCreateResponse)
async def ingestion_upload(
  background_tasks: BackgroundTasks,
  file: UploadFile = File(...),
  authorization: str | None = Header(default=None),
) -> IngestionCreateResponse:
  _require_auth(authorization)

  DATA_DIR.mkdir(parents=True, exist_ok=True)
  file_name = file.filename or "uploaded_file"
  destination = DATA_DIR / file_name
  content = await file.read()
  destination.write_bytes(content)

  task = create_task(file_name=file_name)
  background_tasks.add_task(run_ingestion, task.task_id, file_name, file.content_type)
  return IngestionCreateResponse(
    task_id=task.task_id,
    file_name=task.file_name,
    status=task.status,
    progress=task.progress,
    message=task.message,
  )


@app.get("/ingestion/status/{task_id}", response_model=IngestionStatusResponse)
async def ingestion_status(task_id: str, authorization: str | None = Header(default=None)) -> IngestionStatusResponse:
  _require_auth(authorization)
  task = get_task(task_id)
  if not task:
    raise HTTPException(status_code=404, detail="Ingestion task not found.")
  return IngestionStatusResponse(
    task_id=task.task_id,
    file_name=task.file_name,
    status=task.status,
    progress=task.progress,
    message=task.message,
    error=task.error,
  )

