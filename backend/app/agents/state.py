from typing import TypedDict, List


class AgentState(TypedDict):
  query: str
  docs: List
  rewrite_count: int
  web_search_needed: bool
  generation: str
  response: str
  



