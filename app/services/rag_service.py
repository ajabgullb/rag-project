from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

from app.utils.chuncking import create_chunk
from app.services.parsing_service import parse_doc
from app.services.retrieval_service import retrieve_documents

llm = OllamaLLM(model="llama3.2")

def prepare_documents():
  parsed_doc = parse_doc()
  return create_chunk(parsed_doc)


def run_rag_query(query: str, k: int = 10):
  return retrieve_documents(query=query, k=k)

template = """
  You are a helpful assistant, and your job is to answer the user's query based on the context provided.
  
  Here's the user's query: {query}
  Here's the Context to answer user's query: {context}
"""

def generate_response(query: str, k: int = 10) -> str:
  prompt = PromptTemplate.from_template(template)
  chain = prompt | llm

  if query == "":
    return "Query is empty"
  
  context = run_rag_query(query, k)

  if not context:
    return "No relevant context was found for the query."

  context_content = "\n".join(results["content"] for results in context)

  llm_response = chain.invoke(
    {
      "query": query,
      "context": context_content,
    }
  )

  return llm_response




