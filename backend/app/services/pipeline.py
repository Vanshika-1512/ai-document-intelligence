"""
Orchestrates the full document processing pipeline:
extract -> clean/stat -> chunk -> embed -> classify -> summarize -> NER
-> keywords -> sentiment -> persist.

This runs as a FastAPI BackgroundTask so the upload endpoint returns
immediately while heavier NLP work happens asynchronously; the frontend
polls GET /api/documents/{id} for status until it reaches "completed".
"""
import time
import traceback
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.database import models
from app.services import document_processor as dp
from app.services import embeddings, vector_store, summarizer, classifier, ner, keyword_extractor, sentiment
from app.utils.text_cleaner import clean_text, compute_stats, chunk_text


def process_document(document_id: str, db_factory):
    """
    db_factory: callable returning a new SQLAlchemy Session (background
    tasks must not reuse a request-scoped session).
    """
    db: Session = db_factory()
    start = time.time()
    try:
        document = db.query(models.Document).filter(models.Document.id == document_id).first()
        if not document:
            return

        document.status = "extracting"
        db.commit()

        extraction = dp.extract_document(Path(document.stored_path), f".{document.file_type}")
        full_text = extraction["full_text"]
        stats = compute_stats(full_text, page_count=extraction["page_count"])

        document.page_count = stats["page_count"]
        document.word_count = stats["word_count"]
        document.char_count = stats["char_count"]
        document.sentence_count = stats["sentence_count"]
        document.paragraph_count = stats["paragraph_count"]
        document.reading_time_minutes = stats["reading_time_minutes"]
        # --- Chunking & Embeddings ---
        document.status = "embedding"
        db.commit()

        chunk_records = []
        chunk_texts = []
        idx = 0
        for page in extraction["pages"]:
            page_chunks = chunk_text(page["content"])
            for c in page_chunks:
                chunk_records.append(
                    models.DocumentChunk(
                        document_id=document.id,
                        chunk_index=idx,
                        page_number=page["page"],
                        content=c,
                    )
                )
                chunk_texts.append(c)
                idx += 1

        vectors = embeddings.embed_texts(chunk_texts)
        for i, record in enumerate(chunk_records):
            record.vector_index = i
        vector_store.save_vectors(document.id, vectors)
        db.add_all(chunk_records)
        db.commit()

        # --- Analysis: Classification, Summarization, NER, Keywords, Sentiment ---
        document.status = "analyzing"
        db.commit()

        top_label, top_conf, alternatives = classifier.classify_document(full_text)
        summary = summarizer.hierarchical_summary(full_text)
        entities = ner.extract_entities(full_text)
        keywords = keyword_extractor.extract_keywords(full_text)
        sentiment_result = sentiment.analyze_sentiment(full_text, classification_label=top_label)

        analysis = models.DocumentAnalysis(
            document_id=document.id,
            summary_short=summary["short"],
            summary_detailed=summary["detailed"],
            key_points=summary["key_points"],
            section_summaries=None,
            classification_label=top_label,
            classification_confidence=round(top_conf, 3),
            classification_alternatives=[{"label": l, "confidence": round(c, 3)} for l, c in alternatives],
            sentiment_label=sentiment_result["label"],
            sentiment_confidence=sentiment_result["confidence"],
            sentiment_applicable=1 if sentiment_result["applicable"] else 0,
        )
        db.add(analysis)

        db.add_all([
            models.Entity(document_id=document.id, text=e["text"], label=e["label"], count=e["count"])
            for e in entities[:100]
        ])
        db.add_all([
            models.Keyword(document_id=document.id, term=k["term"], score=k["score"])
            for k in keywords
        ])

        document.status = "completed"
        document.processed_date = datetime.utcnow()
        document.processing_time_seconds = round(time.time() - start, 2)
        db.commit()

    except dp.ExtractionError as e:
        db.rollback()
        _mark_failed(db, document_id, str(e))
    except Exception:
        db.rollback()
        _mark_failed(db, document_id, "An unexpected error occurred while analyzing this document.")
        traceback.print_exc()
    finally:
        db.close()


def _mark_failed(db: Session, document_id: str, message: str):
    try:
        document = db.query(models.Document).filter(models.Document.id == document_id).first()
        if document:
            document.status = "failed"
            document.error_message = message
            db.commit()
    except Exception:
        db.rollback()
