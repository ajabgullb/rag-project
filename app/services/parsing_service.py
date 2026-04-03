import sys
from pathlib import Path
from app.core.config import get_api_key
from llama_cloud import LlamaCloud
from langchain_core.documents import Document


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "app" / "data"
sys.path.append(str(PROJECT_ROOT))


llama_api_key = get_api_key("LLAMA_CLOUD_API_KEY")


def parse_doc(
  file_name: str = "Business-Model-of-a-Neobank.pdf",
  tier: str = "fast",
  version: str = "latest",
):
  if not llama_api_key:
    raise ValueError("Missing LLAMA_CLOUD_API_KEY environment variable.")

  file_path = DATA_DIR / file_name
  if not file_path.exists():
    raise FileNotFoundError(f"PDF not found: {file_path}")

  client = LlamaCloud(api_key= llama_api_key)

  with file_path.open("rb") as pdf_file:
    parsed_doc = client.parsing.parse(
      upload_file=(file_path.name, pdf_file, "application/pdf"),
      tier = "agentic_plus",
      version=version,
      expand = ["text", "items"],
    )

  documents = [
    Document(
      page_content=page.text,
      metadata={"page_number": page.page_number}
    )
    for page in parsed_doc.text.pages
  ]
    
  return documents



