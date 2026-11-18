"""
Unit tests for extraction, cleaning, chunking, classification, and keyword
extraction — the components that don't require downloading large
transformer/spaCy models, so this suite runs fast in any environment.

Run with:  pytest tests/ -v
"""
import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.utils.text_cleaner import clean_text, split_sentences, compute_stats, chunk_text
from app.services import document_processor as dp
from app.services.classifier import classify_document
from app.services.keyword_extractor import extract_keywords
from app.main import app
from app.database.database import init_db

init_db()  # ensure tables exist even if the TestClient doesn't fire startup events
client = TestClient(app)


def test_clean_text_normalizes_whitespace():
    dirty = "Hello    world.\r\n\r\n\r\nNext   paragraph."
    cleaned = clean_text(dirty)
    assert "\r" not in cleaned
    assert "    " not in cleaned
    assert "\n\n\n" not in cleaned


def test_split_sentences_basic():
    text = "This is one sentence. This is another! Is this a third?"
    sentences = split_sentences(text)
    assert len(sentences) == 3


def test_compute_stats():
    stats = compute_stats("one two three four five", page_count=2)
    assert stats["word_count"] == 5
    assert stats["page_count"] == 2
    assert stats["reading_time_minutes"] >= 0


def test_chunk_text_respects_size_and_overlap():
    text = " ".join(f"word{i}" for i in range(1000))
    chunks = chunk_text(text, chunk_size_tokens=100, overlap_tokens=20)
    assert len(chunks) > 1
    # consecutive chunks should share some overlapping words
    first_words = set(chunks[0].split())
    second_words = set(chunks[1].split())
    assert first_words & second_words


def test_extract_txt(tmp_path):
    p = tmp_path / "sample.txt"
    p.write_text("Hello world. This is a test document.")
    result = dp.extract_txt(p)
    assert result["page_count"] == 1
    assert "Hello world" in result["full_text"]


def test_extract_txt_empty_raises(tmp_path):
    p = tmp_path / "empty.txt"
    p.write_text("   ")
    with pytest.raises(dp.ExtractionError):
        dp.extract_txt(p)


def test_extract_csv(tmp_path):
    p = tmp_path / "sample.csv"
    p.write_text("name,age\nAlice,30\nBob,25\n")
    result = dp.extract_csv(p)
    assert "Alice" in result["full_text"]
    assert "Columns: name, age" in result["full_text"]


def test_classify_document_report():
    text = (
        "Executive summary: this report presents the quarterly findings. "
        "Recommendations for next quarter are outlined below."
    )
    label, confidence, alternatives = classify_document(text)
    assert label in {"Report", "Business Document", "Other"}
    assert 0.0 <= confidence <= 1.0


def test_extract_keywords_returns_ranked_terms():
    text = (
        "Artificial intelligence is transforming natural language processing. "
        "Natural language processing enables machines to understand text. "
        "Artificial intelligence and machine learning are closely related fields."
    )
    keywords = extract_keywords(text, top_n=5)
    assert len(keywords) > 0
    assert keywords[0]["score"] == 1.0
    scores = [k["score"] for k in keywords]
    assert scores == sorted(scores, reverse=True)


# --- API-level tests ---

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_rejects_unsupported_extension():
    file_content = io.BytesIO(b"not a real file")
    response = client.post(
        "/api/documents/upload",
        files={"file": ("malicious.exe", file_content, "application/octet-stream")},
    )
    assert response.status_code == 400


def test_upload_rejects_empty_file():
    file_content = io.BytesIO(b"")
    response = client.post(
        "/api/documents/upload",
        files={"file": ("empty.txt", file_content, "text/plain")},
    )
    assert response.status_code == 400


def test_get_nonexistent_document_returns_404():
    response = client.get("/api/documents/nonexistent-id")
    assert response.status_code == 404
