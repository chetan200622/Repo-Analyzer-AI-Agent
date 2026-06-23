from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import re

from app.api.dependencies import get_db
from app.domain.models import Repository, AnalysisJob, File
from app.domain.schemas import (
    RepositoryResponse, 
    RepositoryListResponse, 
    FileResponse
)
from app.infrastructure.redis_client import analysis_queue
from app.services.repository_service import clone_and_scan_repo
from pydantic import BaseModel, HttpUrl

router = APIRouter(prefix="/repositories", tags=["repositories"])

class AnalyzeRequest(BaseModel):
    github_url: HttpUrl

def _extract_repo_name(url: str) -> str:
    """Extract owner/repo format from a GitHub URL."""
    match = re.search(r"github\.com/([^/]+)/([^/.]+)", str(url))
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    return "Unknown Repository"

@router.post("/analyze", response_model=RepositoryResponse)
def analyze_repository(request: AnalyzeRequest, db: Session = Depends(get_db)):
    url_str = str(request.github_url).rstrip("/")
    
    # Optional: Basic validation (Does the repo exist? Public?)
    # For now we assume the URL is valid, but we could add an httpx call here.
    
    # Idempotency check: Have we already analyzed this exact URL?
    existing_repo = db.query(Repository).filter(Repository.github_url == url_str).first()
    if existing_repo:
        if existing_repo.status == "READY":
            return existing_repo
        elif existing_repo.status in ["QUEUED", "PROCESSING"]:
            return existing_repo
        # If FAILED, we will retry (delete and recreate)
        db.delete(existing_repo)
        db.commit()

    repo_name = _extract_repo_name(url_str)
    
    # Create new Repository record
    repo = Repository(
        name=repo_name,
        github_url=url_str,
        status="QUEUED"
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    # Create new AnalysisJob record
    job = AnalysisJob(
        repo_id=repo.id,
        status="QUEUED",
        current_step="Pending worker pickup"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Enqueue background task
    analysis_queue.enqueue(
        clone_and_scan_repo,
        args=(str(job.id), str(repo.id), url_str),
        job_id=str(job.id),
        job_timeout="10m"
    )

    return repo

@router.get("", response_model=RepositoryListResponse)
def list_repositories(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    total = db.query(Repository).count()
    repos = db.query(Repository).order_by(Repository.created_at.desc()).offset(skip).limit(limit).all()
    
    return RepositoryListResponse(
        repositories=repos,
        total=total
    )

@router.get("/{repo_id}", response_model=RepositoryResponse)
def get_repository(repo_id: str, db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo

@router.get("/{repo_id}/files", response_model=list[FileResponse])
def list_repository_files(repo_id: str, db: Session = Depends(get_db)):
    files = db.query(File).filter(File.repo_id == repo_id).order_by(File.path).all()
    return files
