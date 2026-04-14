from pydantic import BaseModel, Field


class RetrievedChunk(BaseModel):
  """One ranked passage returned by `retrieve_documents`."""

  doc_id: str
  content: str
  score: float
  source: str


class RagPromptResponse(BaseModel):
  """JSON body returned by `POST /query`: model-generated answer."""

  response: str = Field(
    description="Answer text from the RAG chain (or a short status message from the service).",
  )
