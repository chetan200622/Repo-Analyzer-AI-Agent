from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.domain.models import AnalysisJob
from app.domain.schemas import AnalysisJobResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/{job_id}", response_model=AnalysisJobResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/repo/{repo_id}", response_model=AnalysisJobResponse)
def get_job_for_repo(repo_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.repo_id == repo_id).order_by(AnalysisJob.created_at.desc()).first()
    if not job:
        raise HTTPException(status_code=404, detail="No jobs found for this repository")
    return job
