# Pydantic schemas for API request/response validation
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


# --- Request Schemas ---


class AnalyzeRepositoryRequest(BaseModel):
    """Request body for POST /api/repositories/analyze."""

    github_url: str = Field(
        ...,
        description="GitHub repository URL",
        examples=["https://github.com/fastapi/fastapi"],
    )
    branch: str = Field(
        default="main",
        description="Branch to analyze",
        examples=["main", "master", "dev"],
    )
    analysis_mode: str = Field(
        default="standard",
        description="Analysis depth: basic, standard, or deep",
        examples=["standard"],
    )
    token: Optional[str] = Field(
        default=None,
        description="GitHub access token for private repositories",
    )


# --- Response Schemas ---


class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str
    version: str
    database: str
    redis: str
    timestamp: datetime


class AnalyzeRepositoryResponse(BaseModel):
    """Response for POST /api/repositories/analyze."""

    repo_id: UUID
    job_id: UUID
    status: str


class RepositoryResponse(BaseModel):
    """Response for repository detail endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    github_url: str
    branch: str
    commit_hash: Optional[str] = None
    status: str
    primary_language: Optional[str] = None
    total_files: int = 0
    total_lines: int = 0
    language_stats: Optional[dict] = None
    dependencies: Optional[dict] = None
    summary: Optional[str] = None
    architecture_diagram: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RepositoryListResponse(BaseModel):
    """Response for GET /api/repositories (paginated list)."""

    repositories: list[RepositoryResponse]
    total: int


class AnalysisJobResponse(BaseModel):
    """Response for GET /api/jobs/{job_id}."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    repo_id: UUID
    status: str
    current_step: Optional[str] = None
    progress_percentage: int = 0
    error_message: Optional[str] = None
    files_scanned: int = 0
    files_ignored: int = 0
    secrets_skipped: int = 0
    languages_detected: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


class FileResponse(BaseModel):
    """Response for file detail endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    repo_id: UUID
    path: str
    language: Optional[str] = None
    size_bytes: int = 0
    line_count: int = 0
    is_indexed: bool = False
    created_at: datetime


class FileListResponse(BaseModel):
    """Response for GET /api/repositories/{repo_id}/files."""

    files: list[FileResponse]
    total: int
