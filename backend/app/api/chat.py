"""
"Ask Your Document" chat endpoint: retrieval-augmented extractive QA.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database import models
from app.models import schemas
from app.services.qa import answer_question

router = APIRouter(prefix="/api/documents", tags=["chat"])


@router.post("/{document_id}/chat", response_model=schemas.ChatResponse)
def chat_with_document(document_id: str, request: schemas.ChatRequest, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    if document.status != "completed":
        raise HTTPException(status_code=202, detail=f"Document is still processing (status: {document.status}).")
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    chunks = [
        {"id": c.id, "content": c.content, "page": c.page_number, "vector_index": c.vector_index}
        for c in document.chunks
    ]
    # Resolve conversation history (from request if provided, otherwise query recent messages)
    history = []
    if request.history:
        history = [{"question": h.question, "answer": h.answer or ""} for h in request.history]
    else:
        recent_messages = (
            db.query(models.ChatMessage)
            .filter(models.ChatMessage.document_id == document_id)
            .order_by(models.ChatMessage.created_at.desc())
            .limit(5)
            .all()
        )
        history = [
            {"question": m.question, "answer": m.answer}
            for m in reversed(recent_messages)
        ]

    result = answer_question(document_id, request.question.strip(), chunks, history=history)

    chat_record = models.ChatMessage(
        document_id=document_id,
        question=request.question.strip(),
        answer=result["answer"],
        sources=result["sources"],
    )
    db.add(chat_record)
    db.commit()

    return schemas.ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        timing=result.get("timing"),
    )


@router.get("/{document_id}/chat/history")
def get_chat_history(document_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.document_id == document_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    return [
        {"question": m.question, "answer": m.answer, "sources": m.sources, "created_at": m.created_at}
        for m in messages
    ]
