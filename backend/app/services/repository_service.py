import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from git import Repo
import logging

# Fix macOS fork() safety issue that causes gitpython to crash with SIGABRT (-6)
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

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

import json
def extract_dependencies(file_path: str, file_name: str) -> Dict[str, str]:
    deps = {}
    try:
        if file_name == "package.json":
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                deps.update(data.get("dependencies", {}))
                deps.update(data.get("devDependencies", {}))
        elif file_name == "requirements.txt":
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("==")
                        if len(parts) == 2:
                            deps[parts[0].strip()] = parts[1].strip()
                        else:
                            deps[line] = "latest"
        elif file_name == "pyproject.toml":
            with open(file_path, "r", encoding="utf-8") as f:
                in_deps = False
                for line in f:
                    line = line.strip()
                    if line.startswith("[tool.poetry.dependencies]") or line.startswith("[project.dependencies]"):
                        in_deps = True
                        continue
                    elif line.startswith("["):
                        in_deps = False
                        
                    if in_deps and "=" in line and not line.startswith("#"):
                        parts = line.split("=")
                        if len(parts) >= 2:
                            deps[parts[0].strip()] = parts[1].strip().strip('"').strip("'")
    except Exception as e:
        logger.warning(f"Failed to parse dependencies from {file_name}: {e}")
    return deps

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
        import subprocess
        logger.info(f"Cloning {github_url} into {target_dir}")
        _update_job(session, job_id, "Cloning repository...", 20)
        
        # Use subprocess instead of GitPython to avoid macOS SIGABRT issues
        subprocess.run(
            ["git", "clone", "--depth=1", github_url, target_dir],
            check=True,
            capture_output=True,
            text=True
        )
        
        _update_job(session, job_id, "Scanning files...", 40)
        
        files_scanned = 0
        files_ignored = 0
        secrets_skipped = 0
        total_lines = 0
        total_bytes = 0
        language_stats: Dict[str, int] = {}
        dependencies_gathered: Dict[str, str] = {}
        
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
                
                # Extract dependencies
                if file_name in ["package.json", "requirements.txt", "pyproject.toml"]:
                    deps = extract_dependencies(file_path, file_name)
                    dependencies_gathered.update(deps)

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
            repo.dependencies = dependencies_gathered
            
            # Determine primary language
            if language_stats:
                repo.primary_language = max(language_stats.items(), key=lambda x: x[1])[0]
                
            # Extract README for better context
            readme_content = ""
            readme_path = os.path.join(target_dir, "README.md")
            if os.path.exists(readme_path):
                try:
                    with open(readme_path, "r", encoding="utf-8") as f:
                        readme_content = f.read()[:2000] # First 2000 chars is usually enough for a summary
                except Exception:
                    pass
                
            # --- Generate AI Architecture Summary ---
            _update_job(session, job_id, "Generating AI Architecture Summary...", 98)
            try:
                from app.services.gemini_client import gemini_client
                prompt = f"""
You are an expert software architect. Analyze the following repository metadata and generate a high-level summary and a clean architecture diagram.

Repository Name: {repo.name}
Primary Language: {repo.primary_language}
Language Stats: {json.dumps(language_stats, indent=2)}
Total Files: {files_scanned}
Dependencies: {json.dumps(dependencies_gathered, indent=2)}

README Snippet:
{readme_content}

Based on the README, dependencies and languages, output exactly two sections:

## Architecture Summary
(Write 2 paragraphs explaining what kind of application this is. If it is a collection of apps or templates, say so explicitly. Do not invent a monolithic web architecture if it is just a monorepo of scripts.)

## Architecture Diagram
(Provide a Mermaid.js `graph TD` diagram showing the likely high level architecture. Keep it clean and avoid excessive criss-crossing edges. Do NOT wrap it in markdown code blocks, just output the raw mermaid code starting with `graph TD`).
"""
                ai_response = gemini_client.invoke(prompt)
                
                if "## Architecture Diagram" in ai_response:
                    parts = ai_response.split("## Architecture Diagram")
                    summary_raw = parts[0].replace("## Architecture Summary", "").strip()
                    diagram_raw = parts[1].strip()
                    if diagram_raw.startswith("```mermaid"):
                        diagram_raw = diagram_raw.replace("```mermaid", "").replace("```", "").strip()
                    elif diagram_raw.startswith("```"):
                        diagram_raw = diagram_raw.replace("```", "").strip()
                    
                    repo.summary = summary_raw
                    repo.architecture_diagram = diagram_raw
                else:
                    repo.summary = ai_response
                    
            except Exception as ai_err:
                logger.error("Failed to generate AI summary: %s", ai_err)

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
