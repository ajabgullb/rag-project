from fastapi import FastAPI

from app.models.request_models import RagPromptRequest
from app.models.response_models import RagPromptResponse
from app.services.rag_service import generate_response

app = FastAPI()


@app.post("/query", response_model=RagPromptResponse)
async def query(body: RagPromptRequest) -> RagPromptResponse:
  text = generate_response(query=body.prompt, k=body.k)
  return RagPromptResponse(response=text)

