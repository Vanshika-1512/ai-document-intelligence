"""
File validation and filesystem helpers.
"""
import re
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

from app.config import settings


def sanitize_filename(filename: str) -> str:
    """Strip directory components and unsafe characters from a filename."""
    name = Path(filename).name  # drop any path components
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name or "file"


def validate_upload(file: UploadFile, file_size: int) -> str:
    """
    Validate extension and size. Returns the lowercase extension (with dot).
    Raises HTTPException(400) on failure. MIME sniffing is best-effort since
    UploadFile.content_type is client-supplied and not fully trustworthy.
    """
    ext = Path(file.filename or "").suffix.lower()

    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(settings.allowed_extensions)}",
        )

    max_bytes = settings.max_upload_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {settings.max_upload_mb}MB upload limit.",
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    return ext


def build_storage_path(original_filename: str, ext: str) -> Path:
    """Generate a unique, collision-free path inside the upload directory."""
    safe_name = sanitize_filename(original_filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    return Path(settings.upload_dir) / unique_name
