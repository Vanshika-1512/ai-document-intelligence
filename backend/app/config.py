"""
Central application configuration.
Reads from environment variables / .env file. Never hardcode secrets here.
"""
import os
from pydantic_settings import BaseSettings
from pathlib import Path

# ---------------------------------------------------------------------------
# HF offline flag: on Render set HF_HUB_OFFLINE=0 so models download on first
# boot.  Locally defaults to 1 (use cache) to avoid slow retry timeouts.
# main.py sets these *before* importing config, so this block is a safety net
# for cases where config is imported in isolation (e.g. tests).
# ---------------------------------------------------------------------------
os.environ.setdefault("HF_HUB_OFFLINE", os.getenv("HF_HUB_OFFLINE", "0"))
os.environ.setdefault("TRANSFORMERS_OFFLINE", os.getenv("TRANSFORMERS_OFFLINE", "0"))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./documents.db"

    # NLP models (all open-source / local by default)
    embedding_model: str = "all-MiniLM-L6-v2"
    summarization_model: str = "sshleifer/distilbart-cnn-12-6"
    qa_model: str = "distilbert-base-cased-distilled-squad"
    sentiment_model: str = "distilbert-base-uncased-finetuned-sst-2-english"
    spacy_model: str = "en_core_web_sm"

    # Optional external LLM — application must work without this
    openai_api_key: str = ""

    # App behaviour
    max_upload_mb: int = 20
    chunk_size_tokens: int = 500
    chunk_overlap_tokens: int = 50
    upload_dir: str = "./uploads"

    # Allowed file types
    allowed_extensions: set = {".pdf", ".docx", ".txt", ".csv"}

    # CORS — comma-separated list of allowed origins.
    # Set this on Render to your Vercel frontend URL.
    # e.g. ALLOWED_ORIGINS=https://your-app.vercel.app
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Ensure upload directory exists
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(f"{settings.upload_dir}/vectors").mkdir(parents=True, exist_ok=True)
