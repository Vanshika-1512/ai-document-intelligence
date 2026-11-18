"""
Lightweight per-document vector store.

Each document's chunk embeddings are saved as a single .npy matrix on disk
(app/../uploads/vectors/{document_id}.npy). This avoids standing up a
dedicated vector database while still supporting fast cosine-similarity
retrieval, and can be swapped for FAISS/pgvector later without changing
the calling code (see search_similar / save_vectors).
"""
from pathlib import Path
import numpy as np

from app.config import settings

VECTOR_DIR = Path(settings.upload_dir) / "vectors"


def _path_for(document_id: str) -> Path:
    return VECTOR_DIR / f"{document_id}.npy"


def save_vectors(document_id: str, vectors: np.ndarray) -> None:
    VECTOR_DIR.mkdir(parents=True, exist_ok=True)
    np.save(_path_for(document_id), vectors)


def load_vectors(document_id: str) -> np.ndarray:
    path = _path_for(document_id)
    if not path.exists():
        return np.zeros((0, 384), dtype="float32")
    return np.load(path)


def cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    if matrix.shape[0] == 0:
        return np.zeros((0,))
    q_norm = query_vec / (np.linalg.norm(query_vec) + 1e-8)
    m_norm = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-8)
    return m_norm @ q_norm


def search_similar(document_id: str, query_vec: np.ndarray, top_k: int = 5):
    """Returns list of (vector_index, score) sorted by descending similarity."""
    matrix = load_vectors(document_id)
    if matrix.shape[0] == 0:
        return []
    scores = cosine_similarity(query_vec, matrix)
    top_idx = np.argsort(-scores)[:top_k]
    return [(int(i), float(scores[i])) for i in top_idx]


def delete_vectors(document_id: str) -> None:
    path = _path_for(document_id)
    if path.exists():
        path.unlink()
