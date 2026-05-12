from app.agents.state import AgentState
from app.services.retrieval_service import retrieve_documents
from app.services.rag_service import generate_response
from app.agents.helper.document_grader import document_grader
from app.agents.helper.query_rewritter import query_rewriter
from langchain_core.documents import Document
from app.agents.tools import web_search_tool

# Retrieve Document Node
def retrieve (state: AgentState) -> AgentState:
  """Return the retrieved docs from the vectorstore"""
  
  state['docs'] = retrieve_documents(state['query'])
  return state

# Grade Document Node
def grade_documents (state: AgentState) -> AgentState:
  """
  Filters state["documents"] down to only the relevant ones.
  Also sets web_search_needed=True if nothing survives the filter.
  """

  query = state['query']
  docs = state['docs']

  filtered_docs = []

  for doc in docs:
    print(doc)
    result = document_grader.invoke({
      "question": query,
      "document": doc["content"]
    })

    if result.binary_score == "yes":
      filtered_docs.append(doc)
    
    if not filtered_docs:
      state['web_search_needed'] = True
  
  return state


def rewrite_query(state: AgentState) -> AgentState:
  query = state["query"]
  count = 0
  
  if count <= state["rewrite_count"]:
    rewritten = query_rewriter.invoke({"query": query})
    state["query"] = rewritten

    count += 1

  return state

def web_search(state: AgentState) -> AgentState:
  query     = state["query"]
  documents = state["docs"]

  results = web_search_tool.invoke({"query": query})

  web_docs = []

  for r in results:
    if isinstance(r, dict):
      web_docs.append({
        "content": r.get("content", ""),
        "source":  r.get("url", ""),
        "score":   1.0
      })
    elif isinstance(r, str):
      web_docs.append({
        "content": r,
        "source":  "web",
        "score":   1.0
      })

  all_docs = documents + web_docs
  state["docs"] = all_docs

  return state

def generate_answer(state: AgentState) -> AgentState:
  """Will Generate the response by using an LLM"""

  state["response"] = generate_response(state["query"])
  return state

