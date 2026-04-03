from fastapi import FastAPI
from app.services.rag_service import generate_response

app = FastAPI()

@app.get("/")
async def root():
  return {"message": "Hello, Ajab!"}


@app.get("/query")
async def query(q: str = "What is the Business Model of a Neobank", k: int = 10):
  results = generate_response(query=q, k=k)
  return {"query": q, "results": results}



