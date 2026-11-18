"""
Automated unit tests for DocMind AI Document Chat & QA service.

Covers:
1. Eradication of the generic 'I couldn't extract a precise answer' phrase.
2. Question intent classification (definitions, explanations, procedures, comparisons, pros/cons, lists, summaries, factual).
3. Conversational query contextualization (pronoun & follow-up resolution using history).
4. Rich structured answer generation with headings, bullet points, and numbered lists.
5. Factual grounding and lack-of-information handling without hallucination.
6. Seamless synthesis fallback when extractive QA returns no span.
7. Accurate source citations and page numbers.
8. Latency timing metrics breakdown.
9. FastAPI chat endpoint end-to-end testing with history.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services import qa
from app.database.database import init_db, SessionLocal
from app.database import models

import numpy as np

init_db()
client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_embed_query(monkeypatch):
    monkeypatch.setattr(
        "app.services.embeddings.embed_query",
        lambda q: np.zeros((384,), dtype="float32"),
    )

SAMPLE_CHUNKS = [
    {
        "id": "chk-1",
        "page": 1,
        "vector_index": 0,
        "content": (
            "DocMind Document Intelligence is an advanced RAG platform for document analysis. "
            "It extracts text, classifies document categories, and generates structured summaries. "
            "The architecture is designed to support scalable multi-format document ingestion."
        ),
    },
    {
        "id": "chk-2",
        "page": 1,
        "vector_index": 1,
        "content": (
            "The document processing pipeline operates in several sequential steps. "
            "First, the system extracts text from PDF and DOCX files. "
            "Second, it cleans the text and computes reading statistics. "
            "Third, the system generates sentence embeddings and saves them to vector storage. "
            "Finally, downstream analyzers perform classification and entity recognition."
        ),
    },
    {
        "id": "chk-3",
        "page": 2,
        "vector_index": 2,
        "content": (
            "Comparing Dense Retrieval and Keyword Search: "
            "Dense retrieval uses sentence embeddings to match semantic intent across vocabularies, "
            "whereas keyword search relies on exact token frequencies. "
            "Dense retrieval provides superior conceptual recall, while keyword search provides precise term matching."
        ),
    },
    {
        "id": "chk-4",
        "page": 2,
        "vector_index": 3,
        "content": (
            "Advantages and limitations of local offline models: "
            "The key advantages include complete data privacy, zero API subscription costs, and offline availability. "
            "Conversely, the limitations include higher local memory requirements and reliance on host CPU or GPU capabilities."
        ),
    },
    {
        "id": "chk-5",
        "page": 3,
        "vector_index": 4,
        "content": (
            "DocMind was founded in 2024 by an AI engineering team. "
            "The headquarters is located in San Francisco, California."
        ),
    },
]


def test_no_generic_failure_message_in_any_scenario():
    """Verify that 'I couldn't extract a precise answer' NEVER appears."""
    questions = [
        "What is DocMind?",
        "Explain the processing pipeline",
        "What are the steps?",
        "Compare dense retrieval and keyword search",
        "What are the advantages and limitations?",
        "List all features",
        "Summarize the document",
        "When was it founded?",
        "Random completely unrelated question about quantum astrophysics?",
    ]
    for q in questions:
        res = qa.answer_question("test-doc", q, SAMPLE_CHUNKS)
        answer = res["answer"]
        assert "I couldn't extract a precise answer" not in answer, f"Generic failure message found for query: {q}"
        assert len(answer.strip()) > 0


def test_classify_question_intent():
    assert qa.classify_question_intent("What is DocMind Document Intelligence?") == qa.INTENT_DEFINITION
    assert qa.classify_question_intent("Define dense retrieval") == qa.INTENT_DEFINITION
    assert qa.classify_question_intent("How does the document processing pipeline work?") == qa.INTENT_EXPLANATION
    assert qa.classify_question_intent("Explain the architecture") == qa.INTENT_EXPLANATION
    assert qa.classify_question_intent("What are the steps to process a document?") == qa.INTENT_PROCEDURE
    assert qa.classify_question_intent("Compare dense retrieval vs keyword search") == qa.INTENT_COMPARISON
    assert qa.classify_question_intent("What are the advantages and disadvantages of local models?") == qa.INTENT_PROS_CONS
    assert qa.classify_question_intent("List the main features") == qa.INTENT_LIST
    assert qa.classify_question_intent("Summarize this document") == qa.INTENT_SUMMARY
    assert qa.classify_question_intent("When was DocMind founded?") == qa.INTENT_FACTUAL
    assert qa.classify_question_intent("Who founded the company?") == qa.INTENT_FACTUAL


def test_contextualize_query_resolves_pronouns():
    history = [
        {
            "question": "What is DocMind Document Intelligence?",
            "answer": "DocMind is an advanced RAG platform for document analysis.",
        }
    ]
    followup_1 = "What are its advantages?"
    contextualized_1 = qa.contextualize_query(followup_1, history)
    assert "DocMind" in contextualized_1

    followup_2 = "Explain this further"
    contextualized_2 = qa.contextualize_query(followup_2, history)
    assert "DocMind" in contextualized_2


def test_definition_answer_structure():
    res = qa.answer_question("test-doc", "What is DocMind Document Intelligence?", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "DocMind" in answer
    assert "### Core Concepts" in answer or "### Key Attributes" in answer
    assert len(res["sources"]) > 0


def test_procedure_answer_structure():
    res = qa.answer_question("test-doc", "What are the steps to process a document?", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "### Step-by-Step Procedure" in answer
    assert "1." in answer
    assert "2." in answer


def test_comparison_answer_structure():
    res = qa.answer_question("test-doc", "Compare dense retrieval and keyword search", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "### Comparison Overview" in answer
    assert "### Key Differences" in answer


def test_pros_and_cons_answer_structure():
    res = qa.answer_question("test-doc", "What are the advantages and limitations of local models?", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "### Advantages & Benefits" in answer
    assert "### Limitations & Considerations" in answer
    assert "privacy" in answer.lower() or "cost" in answer.lower()


def test_list_answer_structure():
    res = qa.answer_question("test-doc", "List the key capabilities of the platform", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "### Identified Items" in answer or "- " in answer


def test_summary_answer_structure():
    res = qa.answer_question("test-doc", "Summarize this document", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "### Document Summary" in answer
    assert "### Key Findings" in answer


def test_factual_answer_structure():
    res = qa.answer_question("test-doc", "When was DocMind founded?", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "**Answer**:" in answer
    assert "2024" in answer


def test_out_of_scope_query_handled_honestly():
    """Verify that questions not in the document are handled gracefully and honestly without hallucination."""
    res = qa.answer_question("test-doc", "What is the boiling temperature of liquid nitrogen on Mars?", SAMPLE_CHUNKS)
    answer = res["answer"]
    assert "does not appear to contain information" in answer or "primarily address" in answer
    assert "I couldn't extract a precise answer" not in answer


def test_sources_citation_structure():
    res = qa.answer_question("test-doc", "Explain text extraction and chunking", SAMPLE_CHUNKS)
    sources = res["sources"]
    assert len(sources) > 0
    first_source = sources[0]
    assert "chunk_id" in first_source
    assert "snippet" in first_source
    assert "score" in first_source
    assert "page" in first_source


def test_timing_metrics_present():
    res = qa.answer_question("test-doc", "What is DocMind?", SAMPLE_CHUNKS)
    assert "timing" in res
    timing = res["timing"]
    assert "retrieval_ms" in timing
    assert "generation_ms" in timing
    assert "total_ms" in timing
    assert timing["total_ms"] >= 0


def test_empty_extractive_qa_model_triggers_synthesis_fallback():
    """Ensure that if the extractive QA model raises an exception, the system synthesizes cleanly."""
    with patch("app.services.qa._get_extractive_pipeline", return_value=None):
        res = qa.answer_question("test-doc", "When was DocMind founded?", SAMPLE_CHUNKS)
        assert len(res["answer"]) > 0
        assert "I couldn't extract a precise answer" not in res["answer"]


def test_chat_api_endpoint_with_history():
    """Test the full /api/documents/{id}/chat endpoint with history."""
    db = SessionLocal()
    # Create a test document
    doc = models.Document(
        id="test-doc-endpoint-1",
        filename="overview.txt",
        file_type="txt",
        file_size_bytes=500,
        page_count=1,
        word_count=50,
        char_count=300,
        sentence_count=3,
        paragraph_count=1,
        reading_time_minutes=0.2,
        status="completed",
        stored_path="overview.txt",
    )
    db.merge(doc)
    
    # Add chunks
    chk = models.DocumentChunk(
        id="chk-ep-1",
        document_id=doc.id,
        chunk_index=0,
        page_number=1,
        content="Antigravity Document Intelligence delivers end-to-end automated NLP processing for business documents.",
        vector_index=0,
    )
    db.merge(chk)
    db.commit()
    db.close()

    # Call chat endpoint
    payload = {
        "question": "What does Antigravity Document Intelligence deliver?",
        "history": [],
    }
    resp = client.post(f"/api/documents/{doc.id}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "sources" in data
    assert "I couldn't extract a precise answer" not in data["answer"]
    assert len(data["answer"]) > 0

    # Call follow-up question
    payload2 = {
        "question": "What documents does it process?",
        "history": [
            {"question": "What does Antigravity Document Intelligence deliver?", "answer": data["answer"]}
        ],
    }
    resp2 = client.post(f"/api/documents/{doc.id}/chat", json=payload2)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2["answer"]) > 0
    assert "I couldn't extract a precise answer" not in data2["answer"]
