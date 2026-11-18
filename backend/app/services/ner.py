"""
Named Entity Recognition service using spaCy.

Run `python -m spacy download en_core_web_sm` once after installing
requirements — see README for the exact command.
"""
from collections import Counter
from functools import lru_cache
from typing import List, Dict

RELEVANT_LABELS = {
    "PERSON": "PERSON",
    "ORG": "ORGANIZATION",
    "GPE": "LOCATION",
    "LOC": "LOCATION",
    "DATE": "DATE",
    "MONEY": "MONEY",
    "PERCENT": "PERCENT",
    "EVENT": "EVENT",
    "PRODUCT": "PRODUCT",
}


@lru_cache(maxsize=1)
def _get_nlp():
    import spacy
    from app.config import settings
    try:
        return spacy.load(settings.spacy_model)
    except OSError as e:
        raise RuntimeError(
            f"spaCy model '{settings.spacy_model}' is not installed. "
            f"Run: python -m spacy download {settings.spacy_model}"
        ) from e


def extract_entities(text: str, max_chars: int = 100_000) -> List[Dict]:
    """
    Returns [{"text": str, "label": str, "count": int}, ...] sorted by frequency.
    Long documents are truncated for performance; this can be swapped for
    chunked processing if exhaustive coverage of very long texts is required.
    """
    nlp = _get_nlp()
    doc = nlp(text[:max_chars])

    counter = Counter()
    for ent in doc.ents:
        label = RELEVANT_LABELS.get(ent.label_)
        if not label:
            continue
        key = (ent.text.strip(), label)
        if key[0]:
            counter[key] += 1

    results = [
        {"text": text_val, "label": label, "count": count}
        for (text_val, label), count in counter.items()
    ]
    results.sort(key=lambda x: -x["count"])
    return results
