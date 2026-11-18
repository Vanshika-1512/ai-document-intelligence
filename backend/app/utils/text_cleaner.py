"""
Text cleaning, statistics, and chunking utilities shared across the NLP pipeline.
"""
import re
from typing import List, Dict

from app.config import settings

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])")
_WHITESPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")


def clean_text(raw: str) -> str:
    """Normalize whitespace while preserving paragraph breaks."""
    if not raw:
        return ""
    text = raw.replace("\r\n", "\n").replace("\r", "\n")
    text = _WHITESPACE_RE.sub(" ", text)
    text = _MULTI_NEWLINE_RE.sub("\n\n", text)
    # Drop control characters / null bytes that occasionally leak from OCR/PDF extraction
    text = "".join(ch for ch in text if ch == "\n" or (ord(ch) >= 32))
    return text.strip()


def split_sentences(text: str) -> List[str]:
    if not text:
        return []
    # Fast heuristic splitter; avoids an NLTK/spaCy dependency for this step alone.
    candidates = _SENTENCE_SPLIT_RE.split(text.replace("\n", " "))
    return [s.strip() for s in candidates if s.strip()]


def compute_stats(text: str, page_count: int = 1) -> Dict:
    words = text.split()
    sentences = split_sentences(text)
    paragraphs = [p for p in text.split("\n\n") if p.strip()]
    word_count = len(words)
    return {
        "word_count": word_count,
        "char_count": len(text),
        "sentence_count": len(sentences),
        "paragraph_count": max(len(paragraphs), 1 if word_count else 0),
        "reading_time_minutes": round(word_count / 200, 1),  # ~200 wpm average reading speed
        "page_count": page_count,
    }


def chunk_text(
    text: str,
    chunk_size_tokens: int = None,
    overlap_tokens: int = None,
) -> List[str]:
    """
    Split text into overlapping word-based chunks suitable for embedding.
    A word-count proxy is used instead of a real tokenizer to avoid a hard
    dependency on a specific model's tokenizer at chunking time.
    """
    chunk_size_tokens = chunk_size_tokens or settings.chunk_size_tokens
    overlap_tokens = overlap_tokens or settings.chunk_overlap_tokens

    words = text.split()
    if not words:
        return []

    chunks = []
    step = max(chunk_size_tokens - overlap_tokens, 1)
    for start in range(0, len(words), step):
        chunk_words = words[start:start + chunk_size_tokens]
        if not chunk_words:
            continue
        chunks.append(" ".join(chunk_words))
        if start + chunk_size_tokens >= len(words):
            break
    return chunks
