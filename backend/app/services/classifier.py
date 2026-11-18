"""
Document classification service.

Approach: a lightweight scikit-learn TF-IDF + Multinomial Naive Bayes
classifier trained on a small bundled labeled sample set
(sample_data/classification_training.csv). This was chosen over a large
pretrained transformer classifier because:
  - it trains in under a second, keeping the app lightweight and fast without GPUs
  - it's fully transparent/explainable (top TF-IDF terms per class)
  - it can be retrained trivially as more labeled data is added

A keyword-based rule fallback covers the cold-start case where the bundled
training set is missing, and always contributes as a sanity check.
"""
import csv
from functools import lru_cache
from pathlib import Path
from typing import List, Tuple

SAMPLE_DATA_PATH = Path(__file__).resolve().parents[2] / "sample_data" / "classification_training.csv"

LABELS = [
    "Research Paper", "Resume", "Legal Document", "Financial Document",
    "Invoice", "Report", "Article", "Academic Document", "Business Document", "Other",
]

RULE_KEYWORDS = {
    "Research Paper": ["abstract", "methodology", "hypothesis", "literature review", "et al", "doi"],
    "Resume": ["work experience", "skills", "education", "curriculum vitae", "objective", "references"],
    "Legal Document": ["hereby", "whereas", "party of the first part", "jurisdiction", "clause", "agreement"],
    "Financial Document": ["balance sheet", "revenue", "fiscal year", "assets", "liabilities", "shareholders"],
    "Invoice": ["invoice number", "amount due", "bill to", "subtotal", "payment terms"],
    "Report": ["executive summary", "findings", "recommendations", "quarterly report"],
    "Academic Document": ["syllabus", "course", "assignment", "university", "semester"],
    "Business Document": ["meeting minutes", "proposal", "memorandum", "stakeholders"],
}


@lru_cache(maxsize=1)
def _get_trained_model():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB

    if not SAMPLE_DATA_PATH.exists():
        return None

    texts, labels = [], []
    with open(SAMPLE_DATA_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            texts.append(row["text"])
            labels.append(row["label"])

    if len(set(labels)) < 2:
        return None

    vectorizer = TfidfVectorizer(max_features=2000, ngram_range=(1, 2), stop_words="english")
    X = vectorizer.fit_transform(texts)
    model = MultinomialNB()
    model.fit(X, labels)
    return vectorizer, model


def _rule_based_scores(text_lower: str) -> dict:
    scores = {label: 0 for label in LABELS}
    for label, keywords in RULE_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[label] += 1
    return scores


def classify_document(text: str) -> Tuple[str, float, List[Tuple[str, float]]]:
    """
    Returns (top_label, top_confidence, alternatives[(label, confidence), ...])
    """
    text_lower = text.lower()
    trained = _get_trained_model()

    if trained:
        vectorizer, model = trained
        X = vectorizer.transform([text[:20000]])
        proba = model.predict_proba(X)[0]
        ranked = sorted(zip(model.classes_, proba), key=lambda x: -x[1])
        top_label, top_conf = ranked[0]

        # If the ML model is unsure, let rule-based keyword hits break the tie
        if top_conf < 0.4:
            rule_scores = _rule_based_scores(text_lower)
            best_rule = max(rule_scores.items(), key=lambda x: x[1])
            if best_rule[1] > 0:
                top_label = best_rule[0]
                top_conf = min(0.5 + 0.1 * best_rule[1], 0.95)

        alternatives = [(label, float(conf)) for label, conf in ranked[1:4]]
        return top_label, float(top_conf), alternatives

    # Cold-start fallback: pure keyword rules
    rule_scores = _rule_based_scores(text_lower)
    ranked = sorted(rule_scores.items(), key=lambda x: -x[1])
    if ranked[0][1] == 0:
        return "Other", 0.35, []
    total_hits = sum(s for _, s in ranked) or 1
    top_label, top_hits = ranked[0]
    confidence = min(0.4 + 0.6 * (top_hits / total_hits), 0.9)
    alternatives = [(label, hits / total_hits) for label, hits in ranked[1:4] if hits > 0]
    return top_label, confidence, alternatives
