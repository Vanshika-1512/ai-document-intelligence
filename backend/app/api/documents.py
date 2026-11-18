"""
Document lifecycle endpoints: upload, list, retrieve, delete.
"""
from typing import List

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.database import get_db, SessionLocal
from app.database import models
from app.models import schemas
from app.utils.file_utils import validate_upload, build_storage_path
from app.services import vector_store
from app.services.pipeline import process_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=schemas.DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    ext = validate_upload(file, len(contents))

    storage_path = build_storage_path(file.filename, ext)
    with open(storage_path, "wb") as f:
        f.write(contents)

    document = models.Document(
        filename=file.filename,
        stored_path=str(storage_path),
        file_type=ext.lstrip("."),
        file_size_bytes=len(contents),
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Heavy NLP work happens in the background; client polls for status.
    background_tasks.add_task(process_document, document.id, SessionLocal)

    return document


@router.get("", response_model=List[schemas.DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).order_by(models.Document.upload_date.desc()).all()


@router.get("/{document_id}", response_model=schemas.DocumentOut)
def get_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return document


@router.get("/{document_id}/text")
def get_document_text(document_id: str, db: Session = Depends(get_db)):
    chunks = (
        db.query(models.DocumentChunk)
        .filter(models.DocumentChunk.document_id == document_id)
        .order_by(models.DocumentChunk.chunk_index)
        .all()
    )
    if not chunks:
        raise HTTPException(status_code=404, detail="No extracted text found for this document.")
    return {"text": "\n\n".join(c.content for c in chunks)}


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    import os
    try:
        if os.path.exists(document.stored_path):
            os.remove(document.stored_path)
    except OSError:
        pass
    vector_store.delete_vectors(document_id)

    db.delete(document)
    db.commit()
    return {"detail": "Document deleted."}
