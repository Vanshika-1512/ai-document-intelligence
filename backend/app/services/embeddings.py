"""
Sentence embedding service. Model is loaded lazily (once) and reused across
requests to avoid repeated, expensive model loads.
"""
import os
import logging
from functools import lru_cache
from typing import List
import numpy as np

from app.config import settings

logger = logging.getLogger("ai-doc-intel.embeddings")


@lru_cache(maxsize=1)
def _get_model():
    from sentence_transformers import SentenceTransformer
    # First attempt: load offline from local cache to avoid huggingface.co retry timeouts
    try:
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        return SentenceTransformer(settings.embedding_model)
    except Exception as e:
        logger.warning("Failed to load embeddings model offline (%s), attempting online load...", e)
        # Fall back to online load if local cache is missing
        os.environ.pop("HF_HUB_OFFLINE", None)
        return SentenceTransformer(settings.embedding_model)


def embed_texts(texts: List[str]) -> np.ndarray:
    """Returns an (n, d) float32 numpy array of embeddings."""
    if not texts:
        return np.zeros((0, 384), dtype="float32")
    try:
        model = _get_model()
        vectors = model.encode(texts, batch_size=32, convert_to_numpy=True, show_progress_bar=False)
        return vectors.astype("float32")
    except Exception as e:
        logger.error("Embedding generation error: %s", e)
        # Fallback pseudo-embeddings if model completely fails to avoid bricking pipeline
        return np.zeros((len(texts), 384), dtype="float32")


def embed_query(query: str) -> np.ndarray:
    return embed_texts([query])[0]
