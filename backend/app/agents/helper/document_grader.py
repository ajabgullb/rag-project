from langchain_core.prompts import ChatPromptTemplate
from app.services.rag_service import _get_llm
from pydantic import BaseModel, Field
from typing import Literal

class GradeDocuments(BaseModel):
  """Binary grade for document relevance."""
  
  binary_score: Literal["yes", "no"] = Field(
    description="Is the document relevant to the question? 'yes' or 'no'."
  )

llm = _get_llm()
structured_llm_grader = llm.with_structured_output(GradeDocuments)

grader_prompt = ChatPromptTemplate.from_messages([
  ("system", """You are a document relevance grader.

  Given a user question and a retrieved document, assess whether 
  the document contains information USEFUL to answer the question.
  
  Be strict — topical similarity is NOT enough. The document must 
  actually help answer the question.
  
  Give a binary score: 'yes' (relevant) or 'no' (not relevant)."""),
  
  ("human", "Question: {question}\n\nDocument:\n{document}")
])

document_grader = grader_prompt | structured_llm_grader

