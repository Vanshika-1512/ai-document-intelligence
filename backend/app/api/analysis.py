"""
Analysis retrieval endpoints — read-only access to results already computed
by the background pipeline (app/services/pipeline.py).
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database import models
from app.models import schemas
from app.services.qa import semantic_search

router = APIRouter(prefix="/api/documents", tags=["analysis"])


def _get_ready_document(document_id: str, db: Session) -> models.Document:
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    if document.status == "failed":
        raise HTTPException(status_code=422, detail=document.error_message or "Document processing failed.")
    if document.status != "completed":
        raise HTTPException(status_code=202, detail=f"Document is still processing (status: {document.status}).")
    return document


@router.get("/{document_id}/analysis", response_model=schemas.AnalysisOut)
def get_analysis(document_id: str, db: Session = Depends(get_db)):
    document = _get_ready_document(document_id, db)
    if not document.analysis:
        raise HTTPException(status_code=404, detail="Analysis not found for this document.")
    a = document.analysis
    return schemas.AnalysisOut(
        summary_short=a.summary_short,
        summary_detailed=a.summary_detailed,
        key_points=a.key_points,
        section_summaries=a.section_summaries,
        classification_label=a.classification_label,
        classification_confidence=a.classification_confidence,
        classification_alternatives=a.classification_alternatives or [],
        sentiment_label=a.sentiment_label,
        sentiment_confidence=a.sentiment_confidence,
        sentiment_applicable=bool(a.sentiment_applicable),
    )


@router.get("/{document_id}/entities", response_model=list[schemas.EntityOut])
def get_entities(document_id: str, db: Session = Depends(get_db)):
    _get_ready_document(document_id, db)
    return (
        db.query(models.Entity)
        .filter(models.Entity.document_id == document_id)
        .order_by(models.Entity.count.desc())
        .all()
    )


@router.get("/{document_id}/keywords", response_model=list[schemas.KeywordOut])
def get_keywords(document_id: str, db: Session = Depends(get_db)):
    _get_ready_document(document_id, db)
    return (
        db.query(models.Keyword)
        .filter(models.Keyword.document_id == document_id)
        .order_by(models.Keyword.score.desc())
        .all()
    )


@router.get("/{document_id}/classification")
def get_classification(document_id: str, db: Session = Depends(get_db)):
    document = _get_ready_document(document_id, db)
    a = document.analysis
    return {
        "label": a.classification_label,
        "confidence": a.classification_confidence,
        "alternatives": a.classification_alternatives or [],
    }


@router.get("/{document_id}/stats", response_model=schemas.DocumentStats)
def get_stats(document_id: str, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return schemas.DocumentStats(
        word_count=document.word_count,
        char_count=document.char_count,
        sentence_count=document.sentence_count,
        paragraph_count=document.paragraph_count,
        reading_time_minutes=document.reading_time_minutes,
        page_count=document.page_count,
    )


@router.get("/{document_id}/search", response_model=list[schemas.SearchResult])
def search_document(document_id: str, q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    document = _get_ready_document(document_id, db)
    chunks = [
        {"id": c.id, "content": c.content, "page": c.page_number, "vector_index": c.vector_index}
        for c in document.chunks
    ]
    results = semantic_search(document_id, q, chunks)
    return [schemas.SearchResult(**r) for r in results]
