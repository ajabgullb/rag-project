from langgraph.graph import StateGraph, START, END
from app.agents.state import AgentState
from app.agents.nodes import (retrieve, grade_documents, rewrite_query, web_search, generate_answer)

# ── Router function ──────────────────────────────────────────
def decide_after_grading(state: AgentState) -> str:
  filtered_docs    = state["docs"]
  needs_web_search = state["web_search_needed"]

  if needs_web_search:
    return "web_search"       # grader flagged knowledge gap
  elif not filtered_docs:
    return "transform_query"  # no docs survived → rewrite
  else:
    return "generate"         # good docs → answer

workflow = StateGraph(AgentState)
workflow.add_node("retrieve",        retrieve)
workflow.add_node("grade_documents", grade_documents)
workflow.add_node("transform_query", rewrite_query)
workflow.add_node("web_search", web_search)
workflow.add_node("generate",        generate_answer)

workflow.add_edge(START, "retrieve")
workflow.add_edge("retrieve", "grade_documents")

workflow.add_conditional_edges(
  "grade_documents",
  decide_after_grading,
  {
    "transform_query": "transform_query",
    "web_search":      "web_search",
    "generate":        "generate",
  }
)

workflow.add_edge("transform_query", "retrieve")
workflow.add_edge("web_search", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()

