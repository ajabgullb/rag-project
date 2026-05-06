from langchain_ollama import OllamaEmbeddings


EMBEDDING_MODEL = "mxbai-embed-large"
# Must match the vector size returned by this model (and the Pinecone index dimension).
EMBEDDING_DIMENSION = 1024


def get_embeddings_model() -> OllamaEmbeddings:
  return OllamaEmbeddings(model=EMBEDDING_MODEL)


def create_query_embeddings(query: str):
  if not query:
    raise ValueError("Enter a valid query.")

  embeddings = get_embeddings_model()
  return embeddings.embed_query(query)


def create_doc_embeddings(docs):
  if not docs:
    raise ValueError("Enter valid docs.")

  embeddings = get_embeddings_model()
  texts = [doc.page_content for doc in docs]
  return embeddings.embed_documents(texts)


