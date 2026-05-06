import os
from dotenv import load_dotenv

load_dotenv()

def get_api_key (api_key_name: str):
  api_key = os.getenv(api_key_name)
  if api_key:
    return api_key
  else:
    return None


def require_pinecone_api_key() -> str:
  key = os.getenv("PINECONE_API_KEY")
  if not key:
    raise ValueError("Missing PINECONE_API_KEY environment variable.")
  return key


def get_pinecone_index_name() -> str:
  return os.getenv("PINECONE_INDEX", "rag-data-structures")


def get_pinecone_namespace() -> str:
  return os.getenv("PINECONE_NAMESPACE", "neobank-kb")


def get_pinecone_embedding_dimension() -> int:
  raw = os.getenv("PINECONE_EMBEDDING_DIMENSION")
  if raw:
    return int(raw)
  from app.services.embedding_service import EMBEDDING_DIMENSION

  return EMBEDDING_DIMENSION


def get_pinecone_serverless_cloud() -> str:
  return os.getenv("PINECONE_CLOUD", "aws")


def get_pinecone_serverless_region() -> str:
  return os.getenv("PINECONE_REGION", "us-east-1")




