"""
ORM models for the AI Document Intelligence System.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship

from app.database.database import Base


def gen_id() -> str:
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=gen_id)
    filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)          # pdf, docx, txt, csv
    file_size_bytes = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    char_count = Column(Integer, default=0)
    sentence_count = Column(Integer, default=0)
    paragraph_count = Column(Integer, default=0)
    reading_time_minutes = Column(Float, default=0.0)

    status = Column(String, default="uploaded")
    # uploaded -> extracting -> analyzing -> embedding -> completed / failed
    error_message = Column(Text, nullable=True)

    upload_date = Column(DateTime, default=datetime.utcnow)
    processed_date = Column(DateTime, nullable=True)
    processing_time_seconds = Column(Float, nullable=True)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    analysis = relationship("DocumentAnalysis", back_populates="document", uselist=False, cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="document", cascade="all, delete-orphan")
    keywords = relationship("Keyword", back_populates="document", cascade="all, delete-orphan")
    chat_history = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    """A chunk of extracted text used for embeddings / retrieval."""
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=gen_id)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    vector_index = Column(Integer, nullable=True)  # row index into the .npy embedding matrix

    document = relationship("Document", back_populates="chunks")


class DocumentAnalysis(Base):
    __tablename__ = "document_analysis"

    id = Column(String, primary_key=True, default=gen_id)
    document_id = Column(String, ForeignKey("documents.id"), unique=True, nullable=False)

    summary_short = Column(Text, nullable=True)
    summary_detailed = Column(Text, nullable=True)
    key_points = Column(JSON, nullable=True)          # list[str]
    section_summaries = Column(JSON, nullable=True)   # list[{title, summary}]

    classification_label = Column(String, nullable=True)
    classification_confidence = Column(Float, nullable=True)
    classification_alternatives = Column(JSON, nullable=True)  # list[{label, confidence}]

    sentiment_label = Column(String, nullable=True)
    sentiment_confidence = Column(Float, nullable=True)
    sentiment_applicable = Column(Integer, default=1)  # 0/1 boolean

    document = relationship("Document", back_populates="analysis")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, default=gen_id)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    text = Column(String, nullable=False)
    label = Column(String, nullable=False)   # PERSON, ORG, GPE, DATE, MONEY, ...
    count = Column(Integer, default=1)

    document = relationship("Document", back_populates="entities")


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(String, primary_key=True, default=gen_id)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    term = Column(String, nullable=False)
    score = Column(Float, nullable=False)

    document = relationship("Document", back_populates="keywords")


class ChatMessage(Base):
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True, default=gen_id)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # list[{chunk_id, page, snippet, score}]
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chat_history")
