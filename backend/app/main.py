"""
AI Document Intelligence System — FastAPI entrypoint.

Run with:
    uvicorn app.main:app --reload
"""
import logging
import os

# ---------------------------------------------------------------------------
# Offline / online model loading
# On Render (or any cloud host) HF_HUB_OFFLINE must be "0" so models are
# downloaded on first boot.  Locally it defaults to "1" (use cache) to avoid
# slow Hugging Face retries.  Set the env var explicitly in your deployment
# environment to override.
# ---------------------------------------------------------------------------
os.environ.setdefault("HF_HUB_OFFLINE", os.getenv("HF_HUB_OFFLINE", "0"))
os.environ.setdefault("TRANSFORMERS_OFFLINE", os.getenv("TRANSFORMERS_OFFLINE", "0"))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.database.database import init_db
from app.api import documents, analysis, chat, comparison

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-doc-intel")

app = FastAPI(
    title="AI Document Intelligence System",
    description="Upload documents, extract insights, summarize, classify, and chat with your documents using NLP.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — origins are read from the ALLOWED_ORIGINS env var (comma-separated)
# so the Vercel URL can be added without touching code.
# Falls back to localhost dev origins when the env var is not set.
# ---------------------------------------------------------------------------
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("Database initialized. AI Document Intelligence System is ready.")


# --- Global error handlers: never leak raw stack traces to the client ---

@app.exception_handler(SQLAlchemyError)
async def db_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error")
    return JSONResponse(status_code=500, content={"detail": "A database error occurred. Please try again."})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred."})


app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(chat.router)
app.include_router(comparison.router)


@app.get("/")
def root():
    return {
        "service": "AI Document Intelligence System",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
