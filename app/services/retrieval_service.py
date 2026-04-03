from langchain_core.documents.base import Document


from app.db.vector_db import ensure_index_fresh, similarity_search_with_score
from app.dsa.priority_queue import Document, PriorityQueue
from app.services.embedding_service import get_embeddings_model
from app.services.parsing_service import parse_doc
from app.utils.chuncking import create_chunk


def retrieve_documents(query: str, k: int = 10) -> list[dict]:
  if not query:
    raise ValueError("Query cannot be empty.")

  parsed_doc = parse_doc()
  _, unique_docs = create_chunk(parsed_doc)
  embeddings = get_embeddings_model()
  ensure_index_fresh(unique_docs, embeddings)
  docs_with_scores = similarity_search_with_score(query, embeddings, k=k)

  queue = PriorityQueue(max_docs=k)

  for index, (doc, score) in enumerate[tuple[Document, float]](docs_with_scores):
    queue.insert(
      Document(
        doc_id=doc.metadata.get("chunk_id", f"doc-{index}"),
        content=doc.page_content,
        score=float(score),
        source=str(doc.metadata.get("page_number", "unknown")),
      )
    )

  ranked_docs = queue.drain_ranked()
  return [
    {
      "doc_id": doc.doc_id,
      "content": doc.content,
      "score": doc.score,
      "source": doc.source,
    }
    for doc in ranked_docs
  ]

