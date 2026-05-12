from langchain_tavily import TavilySearch
import os

os.environ["TAVILY_API_KEY"]

web_search_tool = TavilySearch(
  max_results=3,
  include_answer=True,
)

