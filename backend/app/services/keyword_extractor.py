"""
Keyword extraction service.

Uses TF-IDF over the document's own sentences as pseudo-documents, which
surfaces terms that are locally important without needing an external
corpus. This is fast, dependency-light (scikit-learn only), and produces
scores that are directly explainable (they ARE the TF-IDF weights).
"""
from typing import List, Dict

from app.utils.text_cleaner import split_sentences


def extract_keywords(text: str, top_n: int = 15) -> List[Dict]:
    from sklearn.feature_extraction.text import TfidfVectorizer

    sentences = split_sentences(text)
    if len(sentences) < 3:
        sentences = [text]  # fall back to whole-document TF-IDF for very short texts

    try:
        vectorizer = TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),
            stop_words="english",
            min_df=1,
        )
        matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return []

    scores = matrix.sum(axis=0).A1
    terms = vectorizer.get_feature_names_out()

    ranked = sorted(zip(terms, scores), key=lambda x: -x[1])
    max_score = ranked[0][1] if ranked else 1.0

    keywords = [
        {"term": term, "score": round(float(score / max_score), 3)}
        for term, score in ranked[:top_n]
        if score > 0
    ]
    return keywords
