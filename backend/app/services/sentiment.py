"""
Sentiment analysis service.

Sentiment is only meaningful for opinion/narrative-bearing text (articles,
reviews, reports). For structurally factual documents (invoices, financial
statements, resumes, legal contracts) we explicitly report it as not
applicable rather than emitting a misleading score.
"""
from functools import lru_cache
from typing import Dict

NOT_APPLICABLE_CLASSES = {"Invoice", "Financial Document", "Legal Document", "Resume"}


@lru_cache(maxsize=1)
def _get_pipeline():
    from transformers import pipeline
    from app.config import settings
    return pipeline("sentiment-analysis", model=settings.sentiment_model)


def analyze_sentiment(text: str, classification_label: str = None) -> Dict:
    if classification_label in NOT_APPLICABLE_CLASSES:
        return {"applicable": False, "label": None, "confidence": None}

    sample = text[:2000].strip()
    if not sample:
        return {"applicable": False, "label": None, "confidence": None}

    try:
        clf = _get_pipeline()
        result = clf(sample, truncation=True)[0]
        label = "Positive" if result["label"].upper() == "POSITIVE" else "Negative"
        # A near-50/50 score suggests genuinely neutral/mixed content
        confidence = float(result["score"])
        if confidence < 0.6:
            label = "Neutral"
        return {"applicable": True, "label": label, "confidence": round(confidence, 3)}
    except Exception:
        return {"applicable": False, "label": None, "confidence": None}
