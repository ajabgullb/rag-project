from langchain_text_splitters import RecursiveCharacterTextSplitter
import hashlib

# Generating ids for documents
def generate_id(text):
  return hashlib.sha256(text.encode('utf-8')).hexdigest()


def create_chunk (doc):
  splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20, add_start_index=True)
  chunks = splitter.split_documents(doc)

  unique_docs = []
  seen_ids = set()

  for chunk in chunks:
    chunk_id = generate_id(chunk.page_content)

    if chunk_id not in seen_ids:
      chunk.metadata["chunk_id"] = chunk_id
      unique_docs.append(chunk)
      seen_ids.add(chunk_id)
  
  return chunks, unique_docs


