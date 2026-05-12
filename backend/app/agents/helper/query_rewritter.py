from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.services.rag_service import _get_llm

llm = _get_llm()

# Rewrite Query Node
query_rewriter_prompt = ChatPromptTemplate.from_messages([
  ("system", """You are a user query rewritter.

  Given a user's query, assess what are the logical elements lacking in the user's query, and rewrite the whole query with those elements to retrieve relevant docs from the knowledge base.

  Return ONLY the rewritten query — no explanation, no preamble."""),

  ("human", "Question: {query}")
])

query_rewriter = query_rewriter_prompt | llm | StrOutputParser()

