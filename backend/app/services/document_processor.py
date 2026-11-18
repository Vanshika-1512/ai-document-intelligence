"""
Extracts raw text (and page structure where applicable) from uploaded files.
Supports: PDF (PyMuPDF), DOCX (python-docx), TXT, CSV (pandas).
"""
from pathlib import Path
from typing import List, Dict

from app.utils.text_cleaner import clean_text


class ExtractionError(Exception):
    """Raised when a document cannot be parsed/extracted."""
    pass


def extract_pdf(path: Path) -> Dict:
    import fitz  # PyMuPDF

    try:
        doc = fitz.open(str(path))
    except Exception as e:
        raise ExtractionError(f"Could not open PDF (it may be corrupted or encrypted): {e}")

    pages: List[Dict] = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text") or ""
        pages.append({"page": i, "content": clean_text(text)})
    doc.close()

    full_text = "\n\n".join(p["content"] for p in pages if p["content"])
    if not full_text.strip():
        raise ExtractionError(
            "No extractable text found. This PDF may be a scanned image — OCR support is required."
        )

    return {"pages": pages, "full_text": full_text, "page_count": len(pages)}


def extract_docx(path: Path) -> Dict:
    import docx

    try:
        document = docx.Document(str(path))
    except Exception as e:
        raise ExtractionError(f"Could not open DOCX file: {e}")

    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
    full_text = clean_text("\n\n".join(paragraphs))

    if not full_text.strip():
        raise ExtractionError("The DOCX file appears to be empty.")

    # DOCX has no fixed page concept without rendering; treat as a single logical page.
    return {"pages": [{"page": 1, "content": full_text}], "full_text": full_text, "page_count": 1}


def extract_txt(path: Path) -> Dict:
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        raise ExtractionError(f"Could not read TXT file: {e}")

    full_text = clean_text(raw)
    if not full_text.strip():
        raise ExtractionError("The TXT file is empty.")

    return {"pages": [{"page": 1, "content": full_text}], "full_text": full_text, "page_count": 1}


def extract_csv(path: Path) -> Dict:
    import pandas as pd

    try:
        df = pd.read_csv(path)
    except Exception as e:
        raise ExtractionError(f"Could not parse CSV file: {e}")

    if df.empty:
        raise ExtractionError("The CSV file has no rows.")

    # Render as readable text: column overview + row-by-row summary (capped for very large files)
    lines = [f"Columns: {', '.join(str(c) for c in df.columns)}", f"Rows: {len(df)}", ""]
    preview = df.head(500)
    for _, row in preview.iterrows():
        lines.append(" | ".join(f"{col}: {row[col]}" for col in df.columns))

    full_text = clean_text("\n".join(lines))
    return {"pages": [{"page": 1, "content": full_text}], "full_text": full_text, "page_count": 1}


EXTRACTORS = {
    ".pdf": extract_pdf,
    ".docx": extract_docx,
    ".txt": extract_txt,
    ".csv": extract_csv,
}


def extract_document(path: Path, ext: str) -> Dict:
    """
    Dispatch to the correct extractor.
    Returns: {"pages": [{"page": int, "content": str}, ...], "full_text": str, "page_count": int}
    """
    extractor = EXTRACTORS.get(ext)
    if not extractor:
        raise ExtractionError(f"No extractor registered for '{ext}' files.")
    return extractor(path)
