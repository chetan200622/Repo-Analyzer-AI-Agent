import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from git import Repo
import logging

from app.infrastructure.database import SessionLocal
from app.domain.models import Repository, AnalysisJob, File

logger = logging.getLogger(__name__)

CLONE_DIR = "/tmp/repomind_clones"

IGNORED_DIRS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "dist",
    "build",
    "coverage",
    "__pycache__",
    ".next",
    ".cache",
}

SECRET_FILES = {
    ".env",
    ".env.local",
    "id_rsa",
    "credentials.json",
    "secrets.yaml",
    "secrets.yml",
}

SECRET_EXTENSIONS = {
    ".pem",
    ".key",
}

LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript React",
    ".jsx": "JavaScript React",
    ".md": "Markdown",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".html": "HTML",
    ".css": "CSS",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++ Header",
    ".sh": "Shell",
}

def _update_job(session, job_id: str, step: str, progress: int, status: str = "IN_PROGRESS", error_msg: Optional[str] = None):
    job = session.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if job:
        job.current_step = step
        job.progress_percentage = progress
        job.status = status
        if error_msg:
            job.error_message = error_msg
        session.commit()

def clone_and_scan_repo(job_id: str, repo_id: str, github_url: str):
    """Background worker function to clone and scan a repository."""
    session = SessionLocal()
    target_dir = os.path.join(CLONE_DIR, str(repo_id))
    
    try:
        _update_job(session, job_id, "Starting clone", 10)
        
        # Ensure clone dir exists
        os.makedirs(CLONE_DIR, exist_ok=True)
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)

        # Clone repository
        logger.info(f"Cloning {github_url} into {target_dir}")
        _update_job(session, job_id, "Cloning repository...", 20)
        Repo.clone_from(github_url, target_dir, depth=1)
        
        _update_job(session, job_id, "Scanning files...", 40)
        
        files_scanned = 0
        files_ignored = 0
        secrets_skipped = 0
        total_lines = 0
        total_bytes = 0
        language_stats: Dict[str, int] = {}
        
        file_records: List[File] = []
        
        for root, dirs, files in os.walk(target_dir):
            # Mutate dirs in-place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
            
            for file_name in files:
                file_path = os.path.join(root, file_name)
                rel_path = os.path.relpath(file_path, target_dir)
                
                # Check for secrets
                _, ext = os.path.splitext(file_name)
                if file_name in SECRET_FILES or ext in SECRET_EXTENSIONS:
                    secrets_skipped += 1
                    continue
                
                language = LANGUAGE_MAP.get(ext)
                if not language:
                    files_ignored += 1
                    continue
                
                # Try reading the file to get line count
                try:
                    file_size = os.path.getsize(file_path)
                    if file_size > 1024 * 1024:  # Skip files > 1MB
                        files_ignored += 1
                        continue
                        
                    total_bytes += file_size
                    
                    with open(file_path, "r", encoding="utf-8") as f:
                        line_count = sum(1 for _ in f)
                    
                    total_lines += line_count
                    files_scanned += 1
                    
                    language_stats[language] = language_stats.get(language, 0) + 1
                    
                    file_records.append(
                        File(
                            repo_id=repo_id,
                            path=rel_path,
                            language=language,
                            size_bytes=file_size,
                            line_count=line_count,
                            is_indexed=False
                        )
                    )
                except UnicodeDecodeError:
                    # Skip binary files or unreadable text files
                    files_ignored += 1
                except Exception as e:
                    logger.warning(f"Error reading file {file_path}: {e}")
                    files_ignored += 1

        _update_job(session, job_id, "Saving metadata to database...", 80)
        
        # Save files to database
        if file_records:
            session.bulk_save_objects(file_records)
            
        _update_job(session, job_id, "Parsing and chunking codebase...", 85)
        
        # Import AI services here to avoid circular dependencies or slow startup
        from app.services.parser_service import parser_service
        from app.services.embedding_service import embedding_service
        from app.infrastructure.qdrant import qdrant_service
        from qdrant_client.http.models import PointStruct
        
        all_points = []
        
        # Mapping from our DB language string to tree-sitter language name
        TS_LANG_MAP = {
            "JavaScript": "javascript",
            "TypeScript": "typescript",
            "TypeScript React": "tsx",
            "JavaScript React": "javascript",
            "Go": "go",
            "Rust": "rust",
            "Java": "java",
            "C++": "cpp"
        }
        
        for file_record in file_records:
            full_path = os.path.join(target_dir, file_record.path)
            chunks = []
            
            if file_record.language == "Python":
                chunks = parser_service.parse_python_file(full_path)
            elif file_record.language in TS_LANG_MAP:
                ts_lang = TS_LANG_MAP[file_record.language]
                chunks = parser_service.parse_generic_file(full_path, ts_lang)
            
            if not chunks:
                continue
                    
                # Format text to include rich context for embedding
                texts_to_embed = [
                    f"File: {file_record.path}\nType: {c.chunk_type}\nName: {c.name}\n\n{c.code}"
                    for c in chunks
                ]
                
                # Generate embeddings (this will auto-download the model on first run)
                embeddings = embedding_service.generate_embeddings(texts_to_embed)
                
                # Create Qdrant points
                for i, chunk in enumerate(chunks):
                    # Generate a unique deterministic UUID for the chunk
                    point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{repo_id}:{file_record.path}:{chunk.start_line}:{chunk.name}"))
                    
                    payload = {
                        "repo_id": repo_id,
                        "file_path": file_record.path,
                        "language": "Python",
                        "chunk_type": chunk.chunk_type,
                        "symbol_name": chunk.name,
                        "start_line": chunk.start_line,
                        "end_line": chunk.end_line,
                        "code": chunk.code
                    }
                    
                    all_points.append(
                        PointStruct(
                            id=point_id,
                            vector=embeddings[i],
                            payload=payload
                        )
                    )
                    
        if all_points:
            _update_job(session, job_id, "Storing vectors in Qdrant...", 95)
            # Batch upsert to Qdrant
            batch_size = 100
            for i in range(0, len(all_points), batch_size):
                batch = all_points[i:i + batch_size]
                qdrant_service.upsert_chunks("code_chunks", batch)
            
        # Update repository stats
        repo = session.query(Repository).filter(Repository.id == repo_id).first()
        if repo:
            repo.total_files = files_scanned
            repo.total_lines = total_lines
            repo.language_stats = language_stats
            repo.total_chunks = len(all_points)
            
            # Determine primary language
            if language_stats:
                repo.primary_language = max(language_stats.items(), key=lambda x: x[1])[0]
            repo.status = "READY"
        
        # Mark job completed
        job = session.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.files_scanned = files_scanned
            job.files_ignored = files_ignored
            job.secrets_skipped = secrets_skipped
            job.languages_detected = len(language_stats)
            job.progress_percentage = 100
            job.current_step = "Completed"
            job.status = "COMPLETED"
        
        session.commit()
        logger.info(f"Successfully processed repository {repo_id}")

    except Exception as e:
        logger.error(f"Error processing repository {repo_id}: {str(e)}")
        _update_job(session, job_id, "Failed", progress=0, status="FAILED", error_msg=str(e))
        
        # Mark repo as failed
        repo = session.query(Repository).filter(Repository.id == repo_id).first()
        if repo:
            repo.status = "FAILED"
            session.commit()
    finally:
        session.close()
        # Clean up temporary files
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
            logger.info(f"Cleaned up directory {target_dir}")
