"""
Document comparison endpoint.
"""
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database import models
from app.models import schemas
from app.services import vector_store

router = APIRouter(prefix="/api/documents", tags=["comparison"])


def _load_doc(document_id: str, db: Session) -> models.Document:
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found.")
    if document.status != "completed":
        raise HTTPException(status_code=422, detail=f"Document {document_id} is not fully processed yet.")
    return document


@router.post("/compare", response_model=schemas.CompareResponse)
def compare_documents(request: schemas.CompareRequest, db: Session = Depends(get_db)):
    doc_a = _load_doc(request.document_id_a, db)
    doc_b = _load_doc(request.document_id_b, db)

    # Overall semantic similarity: mean-pooled chunk embeddings, cosine similarity
    vec_a = vector_store.load_vectors(doc_a.id)
    vec_b = vector_store.load_vectors(doc_b.id)

    if vec_a.shape[0] and vec_b.shape[0]:
        mean_a = vec_a.mean(axis=0)
        mean_b = vec_b.mean(axis=0)
        sim = float(
            np.dot(mean_a, mean_b) / (np.linalg.norm(mean_a) * np.linalg.norm(mean_b) + 1e-8)
        )
        similarity_score = round(max(min(sim, 1.0), 0.0) * 100, 1)
    else:
        similarity_score = 0.0

    keywords_a = {k.term for k in doc_a.keywords}
    keywords_b = {k.term for k in doc_b.keywords}

    common = sorted(keywords_a & keywords_b)
    unique_a = sorted(keywords_a - keywords_b)
    unique_b = sorted(keywords_b - keywords_a)

    return schemas.CompareResponse(
        similarity_score=similarity_score,
        common_topics=common[:15],
        unique_to_a=unique_a[:15],
        unique_to_b=unique_b[:15],
        classification_a=doc_a.analysis.classification_label if doc_a.analysis else None,
        classification_b=doc_b.analysis.classification_label if doc_b.analysis else None,
        sentiment_a=doc_a.analysis.sentiment_label if doc_a.analysis else None,
        sentiment_b=doc_b.analysis.sentiment_label if doc_b.analysis else None,
    )
