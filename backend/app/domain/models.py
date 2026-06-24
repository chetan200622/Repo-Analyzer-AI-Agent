# SQLAlchemy ORM models for repositories, analysis jobs, and files
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.infrastructure.database import Base


class Repository(Base):
    """A GitHub repository submitted for analysis."""

    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    github_url = Column(String(500), nullable=False, unique=True)
    branch = Column(String(100), nullable=False, default="main")
    commit_hash = Column(String(40), nullable=True)
    status = Column(
        String(20),
        nullable=False,
        default="QUEUED",
        index=True,
    )
    primary_language = Column(String(50), nullable=True)
    total_files = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    language_stats = Column(JSON, nullable=True)
    dependencies = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    architecture_diagram = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    analysis_jobs = relationship(
        "AnalysisJob",
        back_populates="repository",
        cascade="all, delete-orphan",
    )
    files = relationship(
        "File",
        back_populates="repository",
        cascade="all, delete-orphan",
    )
    messages = relationship(
        "ChatMessage",
        back_populates="repository",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )

    def __repr__(self) -> str:
        return f"<Repository(name={self.name}, status={self.status})>"


class AnalysisJob(Base):
    """Tracks the progress of a repository analysis pipeline."""

    __tablename__ = "analysis_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(20), nullable=False, default="QUEUED", index=True)
    current_step = Column(String(50), nullable=True)
    progress_percentage = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    files_scanned = Column(Integer, default=0)
    files_ignored = Column(Integer, default=0)
    secrets_skipped = Column(Integer, default=0)
    languages_detected = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    repository = relationship("Repository", back_populates="analysis_jobs")

    def __repr__(self) -> str:
        return f"<AnalysisJob(repo_id={self.repo_id}, status={self.status})>"


class File(Base):
    """A source file within an analyzed repository."""

    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    path = Column(String(1000), nullable=False)
    language = Column(String(50), nullable=True, index=True)
    size_bytes = Column(Integer, default=0)
    line_count = Column(Integer, default=0)
    is_indexed = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    repository = relationship("Repository", back_populates="files")

    def __repr__(self) -> str:
        return f"<File(path={self.path}, language={self.language})>"


class ChatMessage(Base):
    """A single chat message in a repository's conversation history."""

    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # Store JSON representation of citations
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    repository = relationship("Repository", back_populates="messages")

    def __repr__(self) -> str:
        return f"<ChatMessage(repo_id={self.repo_id}, role={self.role})>"
