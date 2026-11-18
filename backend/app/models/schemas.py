"""
Pydantic schemas used for API request/response validation.
Kept separate from SQLAlchemy models (app/database/models.py).
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    page_count: int
    word_count: int
    status: str
    error_message: Optional[str] = None
    upload_date: datetime
    processed_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentStats(BaseModel):
    word_count: int
    char_count: int
    sentence_count: int
    paragraph_count: int
    reading_time_minutes: float
    page_count: int


class ClassificationAlt(BaseModel):
    label: str
    confidence: float


class AnalysisOut(BaseModel):
    summary_short: Optional[str]
    summary_detailed: Optional[str]
    key_points: Optional[List[str]]
    section_summaries: Optional[List[dict]]
    classification_label: Optional[str]
    classification_confidence: Optional[float]
    classification_alternatives: Optional[List[ClassificationAlt]]
    sentiment_label: Optional[str]
    sentiment_confidence: Optional[float]
    sentiment_applicable: bool

    class Config:
        from_attributes = True


class EntityOut(BaseModel):
    text: str
    label: str
    count: int

    class Config:
        from_attributes = True


class KeywordOut(BaseModel):
    term: str
    score: float

    class Config:
        from_attributes = True


class ChatMessageHistoryItem(BaseModel):
    question: str
    answer: Optional[str] = None


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[ChatMessageHistoryItem]] = None


class SourceRef(BaseModel):
    chunk_id: str
    page: Optional[int] = None
    snippet: str
    score: float


class ChatTiming(BaseModel):
    retrieval_ms: float
    generation_ms: float
    total_ms: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceRef]
    timing: Optional[ChatTiming] = None


class CompareRequest(BaseModel):
    document_id_a: str
    document_id_b: str


class CompareResponse(BaseModel):
    similarity_score: float
    common_topics: List[str]
    unique_to_a: List[str]
    unique_to_b: List[str]
    classification_a: Optional[str]
    classification_b: Optional[str]
    sentiment_a: Optional[str]
    sentiment_b: Optional[str]


class SearchResult(BaseModel):
    content: str
    page: Optional[int]
    score: float


class ErrorResponse(BaseModel):
    detail: str
