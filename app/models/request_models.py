from pydantic import BaseModel, ConfigDict, Field


class RagPromptRequest(BaseModel):
  """JSON body for `POST /query`: user prompt and optional retrieval depth."""

  model_config = ConfigDict(str_strip_whitespace=True)

  prompt: str = Field(
    ...,
    min_length=0,
    max_length=16_000,
    description="User message used for retrieval and generation.",
  )
  k: int = Field(
    default=10,
    ge=1,
    le=100,
    description="How many ranked chunks to retrieve for context.",
  )
