# Collaboration, GitHub Workflow, Setup, and Build Plan

## Document Purpose

This document explains how two teammates should collaborate to build RepoMind Agent using GitHub, branches, issues, pull requests, local setup, Docker, coding standards, review process, and development roadmap.

This project should be built like a real engineering project, not like two people editing random files.

---

# 1. Team Roles

Assume two people:

- Person A
- Person B

You can rename these later.

---

## 1.1 Person A: AI / Backend / Agent Lead

Primary responsibilities:

- FastAPI backend
- Repository ingestion pipeline
- File scanner
- Code parser
- Chunking
- Embeddings
- Qdrant integration
- RAG pipeline
- LangGraph agents
- Tool registry
- Evaluation logic

Person A owns the intelligence layer.

---

## 1.2 Person B: Frontend / Platform / Integration Lead

Primary responsibilities:

- Next.js frontend
- UI pages
- Dashboard
- File explorer
- Chat UI
- Architecture UI
- Agent trace UI
- Evaluation UI
- API integration
- Docker Compose support
- Deployment/demo polish

Person B owns the product experience layer.

---

## 1.3 Shared Responsibilities

Both must work on:

- System design
- Database schema
- API contracts
- Security rules
- Testing
- Documentation
- README
- Demo video
- Final presentation

Important:

> Do not let one person understand only frontend and the other only AI. Both should understand the complete architecture.

---

# 2. Collaboration Principles

## 2.1 Work Through GitHub Issues

Every task should start as a GitHub Issue.

Issue types:

- Feature
- Bug
- Refactor
- Documentation
- Test
- UI
- Backend
- Agent
- Evaluation

---

## 2.2 Use Pull Requests

No direct pushes to `main`.

Flow:

```text
Create issue
    ↓
Create branch
    ↓
Implement feature
    ↓
Push branch
    ↓
Open pull request
    ↓
Friend reviews
    ↓
Fix comments
    ↓
Merge into dev
```

---

## 2.3 Communicate Daily

Daily update format:

```text
Yesterday:
Today:
Blocked by:
Need review on:
```

Example:

```text
Yesterday: Completed repository scanner.
Today: Working on file parser.
Blocked by: Need final DB schema for symbols table.
Need review on: PR #12.
```

---

# 3. Repository Structure

Use a monorepo.

```text
repomind-agent/
  README.md
  PROJECT_PRD_SYSTEM_DESIGN.md
  UI_PAGES_SPEC.md
  PREREQUISITES_LEARNING_GUIDE.md
  COLLABORATION_GITHUB_WORKFLOW.md

  frontend/
    src/
    package.json
    next.config.js
    tailwind.config.ts

  backend/
    app/
      api/
      core/
      domain/
      services/
      agents/
      tools/
      infrastructure/
    tests/
    requirements.txt
    alembic.ini

  docker-compose.yml
  .env.example
  .gitignore
  Makefile
```

---

# 4. Branching Strategy

Use these branches:

```text
main
dev
feature/*
fix/*
docs/*
refactor/*
test/*
```

## 4.1 main

Stable production/demo branch.

Rules:

- Protected
- No direct push
- Only merge from `dev`
- Must pass tests before merge

## 4.2 dev

Active integration branch.

Rules:

- Feature branches merge into dev
- Test here before merging to main

## 4.3 feature branches

Examples:

```text
feature/repo-scanner
feature/qdrant-indexing
feature/chat-ui
feature/agent-trace-viewer
feature/langgraph-router
```

## 4.4 fix branches

Examples:

```text
fix/job-status-stuck
fix/chat-citation-bug
```

## 4.5 docs branches

Examples:

```text
docs/update-readme
docs/api-contracts
```

---

# 5. Commit Message Rules

Use clear commit messages.

Format:

```text
type: short description
```

Types:

- feat
- fix
- docs
- refactor
- test
- ui
- chore

Examples:

```text
feat: add repository scanner
feat: implement qdrant vector indexing
fix: prevent duplicate analysis jobs
ui: build repository overview page
docs: add API contract documentation
test: add parser unit tests
refactor: extract vector store interface
```

---

# 6. Pull Request Rules

Every PR should include:

```text
What changed?
Why?
Screenshots if UI
How to test?
Linked issue
```

PR template:

```markdown
## Summary

Explain what this PR changes.

## Why

Explain why this change is needed.

## Changes

- 
- 
- 

## Screenshots

Add screenshots for UI changes.

## How to Test

1.
2.
3.

## Linked Issue

Closes #issue_number
```

---

# 7. Code Review Checklist

Before approving a PR, check:

## Backend

- Does it follow clean architecture?
- Is logic placed in correct layer?
- Are errors handled?
- Are database changes migrated?
- Are tests added?
- Are secrets avoided?
- Does it update job status correctly?

## Frontend

- Is UI responsive?
- Are loading states handled?
- Are error states handled?
- Are components reusable?
- Is API state handled with TanStack Query?
- Are buttons connected to actions?
- Is TypeScript clean?

## AI / Agent

- Does the agent use tools before answering?
- Are citations returned?
- Are traces logged?
- Are retrieval results stored?
- Is hallucination minimized?
- Is evaluation considered?

---

# 8. GitHub Project Board

Create a GitHub Project board with columns:

```text
Backlog
Ready
In Progress
In Review
Testing
Done
```

Issue labels:

```text
frontend
backend
agent
rag
graph-rag
database
security
evaluation
documentation
bug
priority-high
priority-medium
priority-low
```

---

# 9. Local Development Setup

## 9.1 Prerequisites

Install:

- Git
- Node.js LTS
- Python 3.11+
- Docker
- Docker Compose
- Ollama
- VS Code
- PostgreSQL client optional

---

## 9.2 Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/repomind-agent.git
cd repomind-agent
```

---

## 9.3 Create Environment File

```bash
cp .env.example .env
```

Example `.env`:

```env
APP_ENV=development

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=repomind
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OLLAMA_BASE_URL=http://ollama:11434

LLM_MODEL=qwen2.5-coder:7b
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

JWT_SECRET=change_this_secret
JWT_ALGORITHM=HS256
```

Never commit `.env`.

---

# 10. Docker Compose Setup

Services:

```text
frontend
backend
worker
postgres
redis
qdrant
ollama
```

Start all services:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d --build
```

Stop services:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend
```

---

# 11. Backend Setup Without Docker

From project root:

```bash
cd backend
python -m venv venv
```

Activate venv:

On Windows:

```bash
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

---

# 12. Frontend Setup Without Docker

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

# 13. Ollama Setup

Install Ollama.

Pull model:

```bash
ollama pull qwen2.5-coder:7b
```

Alternative smaller models:

```bash
ollama pull qwen2.5-coder:1.5b
ollama pull phi3:mini
ollama pull deepseek-coder:6.7b
```

Run:

```bash
ollama run qwen2.5-coder:7b
```

Ollama API runs at:

```text
http://localhost:11434
```

---

# 14. Database Migration Workflow

Use Alembic.

Create migration:

```bash
cd backend
alembic revision --autogenerate -m "create repository tables"
```

Apply migration:

```bash
alembic upgrade head
```

Rollback:

```bash
alembic downgrade -1
```

Rules:

- Every database schema change needs migration
- Do not manually change database in only local environment
- Commit migration files

---

# 15. Backend Folder Responsibilities

```text
backend/app/api/
```

HTTP routes only.

```text
backend/app/services/
```

Business logic.

```text
backend/app/agents/
```

LangGraph agents and workflows.

```text
backend/app/tools/
```

Tools used by agents.

```text
backend/app/infrastructure/
```

External systems: database, Qdrant, Redis, Ollama.

```text
backend/app/domain/
```

Entities and interfaces.

```text
backend/tests/
```

Unit and integration tests.

---

# 16. Frontend Folder Responsibilities

```text
frontend/src/app/
```

Routes and pages.

```text
frontend/src/components/
```

Reusable UI components.

```text
frontend/src/services/
```

API clients.

```text
frontend/src/types/
```

TypeScript types.

```text
frontend/src/store/
```

Zustand stores.

```text
frontend/src/lib/
```

Utility functions.

---

# 17. API Contract Workflow

Before frontend and backend work on a feature, define API contract.

Example:

```text
POST /api/repositories/analyze
```

Request:

```json
{
  "github_url": "https://github.com/user/repo",
  "branch": "main",
  "analysis_mode": "standard"
}
```

Response:

```json
{
  "repo_id": "repo_123",
  "job_id": "job_456",
  "status": "QUEUED"
}
```

Person B can build frontend mock UI using this contract while Person A builds backend.

---

# 18. Development Roadmap

## Phase 0: Planning

Tasks:

- Finalize name
- Create GitHub repo
- Add README
- Add docs
- Create project board
- Create issues
- Setup branch protection

Owner:

- Both

Deliverables:

- Repo initialized
- Docs added
- Issues created

---

## Phase 1: Foundation Setup

Person A:

- FastAPI setup
- PostgreSQL setup
- SQLAlchemy setup
- Alembic setup
- Health check API
- Docker Compose backend services

Person B:

- Next.js setup
- Tailwind setup
- shadcn/ui setup
- Layout components
- Navbar and sidebar
- API client setup

Deliverable:

```text
Frontend and backend run locally with Docker Compose.
```

---

## Phase 2: Repository Analysis Pipeline

Person A:

- GitHub URL validator
- Clone repo tool
- File scanner
- Secret filter
- Job status system
- Analysis worker

Person B:

- Analyze New Repository page
- Analysis Progress page
- Job polling
- Logs UI
- Success/failure states

Deliverable:

```text
User submits GitHub URL and sees analysis progress.
```

---

## Phase 3: Code Parsing and Database Storage

Person A:

- Python AST parser
- JS/TS import parser
- Symbol extraction
- Dependency extraction
- Store files/symbols/dependencies

Person B:

- Repository Overview page
- File Explorer page
- File Detail page
- Symbols and dependencies UI

Deliverable:

```text
Repository structure, symbols, and dependencies are visible in UI.
```

---

## Phase 4: Vector Indexing and RAG

Person A:

- Chunking service
- Embedding service
- Qdrant integration
- Semantic search
- Keyword/symbol search
- Chat endpoint with citations

Person B:

- Repository Chat page
- Sources panel
- Citation UI
- Chat sessions
- Loading/error states

Deliverable:

```text
User can ask repository questions and get cited answers.
```

---

## Phase 5: Architecture and Graph RAG

Person A:

- Dependency graph builder
- Graph expansion retrieval
- Mermaid generator
- Architecture agent

Person B:

- Architecture page
- Mermaid viewer
- React Flow dependency graph
- Request flow UI
- Node detail drawer

Deliverable:

```text
User can see architecture diagrams and graph-based flows.
```

---

## Phase 6: LangGraph Agent Orchestration

Person A:

- Supervisor agent
- Intent router
- QA agent
- Graph RAG agent
- Documentation agent
- Onboarding agent
- Tool registry

Person B:

- Agent trace preview
- Agent runs list
- Agent run detail page
- Tool call table
- LangGraph flow UI

Deliverable:

```text
Every query is routed through an observable agent workflow.
```

---

## Phase 7: Evaluation System

Person A:

- Evaluation dataset format
- Retrieval metrics
- Citation metrics
- Routing accuracy
- Faithfulness evaluator

Person B:

- Repository evaluation page
- Global evaluations dashboard
- Failed cases UI
- Dataset editor

Deliverable:

```text
System can evaluate and show quality metrics.
```

---

## Phase 8: Documentation and Onboarding

Person A:

- Documentation generator
- Onboarding generator
- Important file ranking

Person B:

- Onboarding page
- Documentation page
- Export markdown buttons
- Copy/download actions

Deliverable:

```text
System generates onboarding guide and project documentation.
```

---

## Phase 9: Testing, Polish, Demo

Both:

- Fix bugs
- Add tests
- Improve UI
- Improve prompts
- Add screenshots
- Record demo video
- Final README
- Final architecture docs

Deliverable:

```text
Portfolio-ready AI Agent project.
```

---

# 19. Weekly Plan

## Week 1

- Repo setup
- Docker Compose
- FastAPI skeleton
- Next.js skeleton
- PostgreSQL connection
- Health checks

## Week 2

- Repository validation
- Cloning
- File scanning
- Analysis progress UI

## Week 3

- Code parser
- File explorer
- Symbol extraction
- Dependency extraction

## Week 4

- Embeddings
- Qdrant
- RAG Q&A
- Chat UI

## Week 5

- Graph RAG
- Mermaid architecture
- Architecture UI

## Week 6

- LangGraph agents
- Tool registry
- Agent traces

## Week 7

- Evaluation system
- Failed cases
- Metrics UI

## Week 8

- Documentation
- Onboarding
- Testing
- Demo video
- README polish

---

# 20. Definition of Done

A feature is done only when:

- Backend logic works
- API is documented
- Frontend uses real API
- Loading state exists
- Error state exists
- Tests are added where needed
- PR is reviewed
- Documentation updated if needed

---

# 21. Issue Examples

## Backend Issue

Title:

```text
feat: implement repository file scanner
```

Description:

```text
Build a file scanner that recursively scans cloned repositories, ignores unwanted folders, detects file extensions, and stores file metadata.
```

Acceptance criteria:

- Ignores `.git`, `node_modules`, `venv`, `dist`, `build`
- Skips secret files
- Stores file path, language, size, line count
- Unit tests added

---

## Frontend Issue

Title:

```text
ui: build analysis progress page
```

Description:

```text
Create a page that displays repository analysis progress using job status from backend.
```

Acceptance criteria:

- Shows progress bar
- Shows timeline steps
- Shows live metrics
- Handles failed state
- Handles success state
- Polls `/api/jobs/{job_id}`

---

## Agent Issue

Title:

```text
feat: implement supervisor intent router
```

Description:

```text
Build LangGraph supervisor that classifies user query intent and routes to QA, Architecture, Documentation, or Onboarding agent.
```

Acceptance criteria:

- Supports at least 5 intents
- Logs selected intent
- Routes to correct agent
- Adds test cases

---

# 22. Testing Workflow

Before merging:

## Backend

Run:

```bash
pytest
```

## Frontend

Run:

```bash
npm run lint
npm run test
```

## Docker

Run:

```bash
docker compose up --build
```

Check:

- Frontend opens
- Backend health endpoint works
- Database connects
- Redis connects
- Qdrant connects
- Ollama connects

---

# 23. Environment Variables

`.env.example` should include:

```env
APP_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=repomind
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OLLAMA_BASE_URL=http://ollama:11434

LLM_MODEL=qwen2.5-coder:7b
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

JWT_SECRET=change_this_secret
JWT_ALGORITHM=HS256

MAX_REPO_SIZE_MB=100
MAX_FILE_SIZE_MB=2
```

---

# 24. Security Rules for Collaboration

Never commit:

- `.env`
- API keys
- GitHub tokens
- Private repository tokens
- Database passwords
- Secret files
- Cloned repositories
- Vector DB data folders
- Large generated files

Add to `.gitignore`:

```gitignore
.env
.env.*
!.env.example

node_modules/
venv/
.venv/
__pycache__/
.pytest_cache/

data/
tmp/
repos/
storage/
qdrant_storage/
postgres_data/
redis_data/

*.log
.DS_Store
```

---

# 25. Communication Rules

Use GitHub discussions/issues for technical decisions.

Use this format for decisions:

```markdown
## Decision

What did we decide?

## Reason

Why did we choose it?

## Alternatives Considered

What else did we consider?

## Impact

What changes because of this?
```

Example:

```text
Decision: Use Qdrant instead of Chroma.
Reason: Better metadata filtering and production-style vector DB.
Alternatives: Chroma, FAISS.
Impact: Need Qdrant Docker service and adapter.
```

---

# 26. Demo Preparation

Final demo should show:

1. Repository analysis
2. Progress page
3. Repository overview
4. File explorer
5. Architecture graph
6. Chat with citations
7. Agent trace
8. Evaluation dashboard
9. Failed case analysis
10. README and architecture docs

Record a 3-5 minute video.

---

# 27. Final README Structure

The final README should include:

- Project title
- Demo video
- Screenshots
- Problem statement
- Features
- System architecture
- Tech stack
- Setup instructions
- API overview
- Agent workflow
- RAG workflow
- Evaluation metrics
- Security model
- Folder structure
- Team contribution
- Future improvements

---

# 28. Collaboration Success Rule

The project is successful if both teammates can explain:

- System architecture
- RAG pipeline
- LangGraph workflow
- Database schema
- Agent traces
- Evaluation metrics
- Security decisions
- Frontend pages
- GitHub workflow

Do not split knowledge too narrowly. Split responsibilities, not understanding.
