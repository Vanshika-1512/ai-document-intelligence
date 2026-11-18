"""
Summarization service.

Uses a Hugging Face abstractive summarization pipeline with an extractive fallback.
Long documents are handled hierarchically by selecting representative sections,
avoiding endless CPU beam-search loops on large documents.
"""
import os
import logging
from functools import lru_cache
from typing import List, Dict

from app.utils.text_cleaner import chunk_text, split_sentences

logger = logging.getLogger("ai-doc-intel.summarizer")
MAX_INPUT_WORDS_PER_CALL = 700


@lru_cache(maxsize=1)
def _get_pipeline():
    from transformers import pipeline
    from app.config import settings
    # First try offline loading
    try:
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        return pipeline("summarization", model=settings.summarization_model)
    except Exception as e:
        logger.warning("Offline summarizer load failed (%s), attempting online load...", e)
        os.environ.pop("HF_HUB_OFFLINE", None)
        return pipeline("summarization", model=settings.summarization_model)


def _summarize_chunk(text: str, max_len: int, min_len: int) -> str:
    # Ensure text is not too short for the requested min_len
    words = text.split()
    if len(words) < min_len:
        return text.strip()
    summarizer = _get_pipeline()
    actual_max = min(max_len, max(len(words), min_len + 5))
    actual_min = min(min_len, actual_max - 5)
    result = summarizer(
        text[:3000],
        max_length=actual_max,
        min_length=max(5, actual_min),
        do_sample=False,
        num_beams=2,
    )
    return result[0]["summary_text"].strip()


def hierarchical_summary(full_text: str) -> Dict:
    """
    Returns {"short": str, "detailed": str, "key_points": list[str]}
    """
    if not full_text.strip():
        return {"short": "", "detailed": "", "key_points": []}

    word_chunks = chunk_text(full_text, chunk_size_tokens=MAX_INPUT_WORDS_PER_CALL, overlap_tokens=0)

    # For long documents (> 4 chunks), pick representative chunks (intro, core body, conclusion)
    # to avoid 5-10 minute sequential beam-search generation on CPU.
    if len(word_chunks) > 4:
        selected_chunks = [
            word_chunks[0],
            word_chunks[1],
            word_chunks[len(word_chunks) // 2],
            word_chunks[-1],
        ]
    else:
        selected_chunks = word_chunks

    # Summarize selected chunks
    chunk_summaries: List[str] = []
    for chunk in selected_chunks:
        try:
            chunk_summaries.append(_summarize_chunk(chunk, max_len=130, min_len=25))
        except Exception as e:
            logger.warning("Neural chunk summarization failed: %s; using extractive fallback", e)
            sentences = split_sentences(chunk)
            chunk_summaries.append(" ".join(sentences[:2]))

    combined = " ".join(chunk_summaries)

    # If we had multiple chunks, do a second pass to compress into one coherent summary
    detailed = combined
    if len(chunk_summaries) > 1:
        try:
            detailed = _summarize_chunk(combined, max_len=200, min_len=45)
        except Exception:
            detailed = combined

    try:
        if len(detailed.split()) > 60:
            short = _summarize_chunk(detailed, max_len=60, min_len=15)
        else:
            short = detailed
    except Exception:
        short = " ".join(split_sentences(detailed)[:2])

    key_points = split_sentences(detailed)[:6]
    if len(key_points) < 3:
        all_sentences = split_sentences(full_text)
        key_points = all_sentences[:5]

    return {"short": short, "detailed": detailed, "key_points": key_points}


def section_summaries(sections: List[Dict]) -> List[Dict]:
    """
    sections: [{"title": str, "content": str}, ...]
    Returns [{"title": str, "summary": str}, ...]
    """
    results = []
    for section in sections:
        content = section.get("content", "")
        if len(content.split()) < 20:
            summary = content
        else:
            try:
                summary = _summarize_chunk(content[: MAX_INPUT_WORDS_PER_CALL * 6], max_len=100, min_len=25)
            except Exception:
                summary = " ".join(split_sentences(content)[:2])
        results.append({"title": section.get("title", "Section"), "summary": summary})
    return results
