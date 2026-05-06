import heapq
from dataclasses import dataclass, field
from typing import Optional
import time


@dataclass
class Document:
  """
    A retrieved RAG document with multi-dimensional priority.
    Priority tuple: (-relevance, -recency, doc_id)

    - negated because heapq is a MIN-heap, we want MAX relevance first
    - recency as tiebreaker (fresher docs win on equal relevance)
    - doc_id as final stable tiebreaker (no ambiguity)
  """

  doc_id:    str
  content:   str
  score:     float
  source:    str
  timestamp: float = field(default_factory=time.time)

  def priority (self):
    return (-self.score, -self.timestamp, self.doc_id)

  def __lt__(self, other):
    return self.priority() < other.priority()



class PriorityQueue:
  """
    Synchronous priority queue for RAG document ranking.
    Engine: heapq (C-speed, battle-tested)
    Pattern: lazy deletion for O(log k) reranking without full rebuild.

    Complexity:
      insert()             → O(log k)
      peek_best()          → O(1)
      pop_best()           → O(log k) amortized
      rerank()             → O(k) scan + O(log k) insert
      build_from_retrieval → O(k) via heapify
      drain_ranked()       → O(k log k)
  """

  def __init__ (self, max_docs: int = 10) -> None:
    self._heap: list = []
    self._removed: set= set()
    self._counter: int = 0
    self.max_docs: int = max_docs
  
  # ── Internals ──────────────────────────────
  
  def _make_entry (self, doc: Document):
    entry = (doc.priority(), self._counter, doc)
    self._counter += 1

    return entry
  
  def _evict_lowest (self):
    """
      Mark the lowest-priority live entry as deleted.
      Called only when over capacity.
      O(k) scan — acceptable since k is small (typically 5-20).
    """

    live = [e for e in self._heap if e[1] not in self._removed]

    if not live:
      return

    worst = max(live, key=lambda e: e[0])
    self._removed.add(worst[1])

  # ── Public Interface ──────────────────────────────

  def insert (self, doc: Document) -> None:
    """Insert a document. Evicts lowest if over capacity. O(log k)"""

    entry = self._make_entry(doc)
    heapq.heappush(self._heap, entry)
    
    if len(self._heap) > self.max_docs:
      self._evict_lowest()

  def peek_best (self):
    """Return highest-relevance doc without removing it. O(1)"""

    for _, counter, doc in self._heap:
      if counter not in self._removed:
        return doc

    return None
  
  def pop_best (self) -> Optional[Document]:
    """Remove and return highest-relevance doc. O(log k) amortized"""

    while self._heap:
      _, counter, doc = heapq.heappop(self._heap)
      if counter not in self._removed:
        return doc
    
    return None
  
  def rerank (self, doc_id: str, new_score: float) -> bool:
    """
      Update a document's relevance score after cross-encoder reranking.
      Uses lazy deletion — no heap rebuild needed.
      Returns True if doc was found and updated, False otherwise.
      O(k) scan + O(log k) insert
    """

    for _, counter, doc in self._heap:
      if doc.doc_id == doc_id and counter not in self._removed:
        self._removed.add(doc)

        updated = Document(
          doc_id = doc.doc_id,
          content = doc.content,
          score = new_score,
          source = doc.source,
          timestamp = doc.timestamp
        )

        heapq.heappush(self._heap, self._make_entry(updated))
        return True
    
    return False
  
  def build_from_retrieval (self, docs: list[Document]) -> None:
    """
      Bulk-load documents using heapify.
      O(k) — not O(k log k) — because heapify exploits the convergent series:
        ∑ h / 2^h  for h=0..log(k)  →  2   (converges to constant)
      Always prefer this over repeated insert() when loading a full batch.
    """

    self._heap = []
    self._removed = set()
    self._counter = 0
    entries = [self._make_entry(doc) for doc in docs]
    heapq.heapify(entries)
    self._heap = entries

  def drain_ranked (self) -> list[Document]:
    """
      Return all docs ranked highest-first. Destructive. O(k log k)
      This is what you feed directly to the LLM context window.
    """

    results = []

    while (doc := self.pop_best()) is not None:
        results.append(doc)
    
    return results
  
  def __len__(self):
    return len(self._heap) - len(self._removed)

  def __repr__(self):
      top = self.peek_best()
      return f"RAGPriorityQueue(size={len(self)}, best_score={top.score if top else 'empty'})"




