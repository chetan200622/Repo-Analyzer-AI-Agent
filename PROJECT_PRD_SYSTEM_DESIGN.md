# AI-Powered GitHub Repository Understanding Agent

## Document Purpose

This document defines the complete product, architecture, system design, technical design, RAG design, agent design, database model, security model, evaluation strategy, and development direction for an AI Agent Engineer-level project.

This project should not be presented as a basic chatbot. It should be presented as a production-style **agentic codebase intelligence platform**.

---

# 1. Project Name

Recommended names:

- RepoMind Agent
- CodeGraph Agent
- Agentic Repository Analyst
- Codebase Intelligence Agent

Final working name used in this document:

> **RepoMind Agent**

---

# 2. One-Line Description

RepoMind Agent is an AI-powered multi-agent system that analyzes GitHub repositories, understands code structure, builds vector and graph indexes, generates architecture diagrams, answers natural language questions with citations, and helps developers onboard faster.

---

# 3. Problem Statement

Large software repositories are difficult to understand because they contain:

- Hundreds or thousands of files
- Multiple folders, frameworks, and layers
- Poor or outdated documentation
- Hidden dependencies between modules
- Complex request/data flows
- Unknown entry points
- Business logic spread across services, utilities, models, and routes

New developers spend days or weeks understanding:

- Where the application starts
- Which files are important
- How modules depend on each other
- How authentication, database, APIs, and business flows work
- How to safely contribute

Existing tools such as GitHub search, static README files, and normal code editors do not provide a repository-level AI understanding experience.

---

# 4. Product Vision

Build an AI Agent system that acts like a senior engineer joining a new codebase.

The agent should be able to:

- Clone and analyze a GitHub repository
- Extract files, functions, classes, imports, routes, and dependencies
- Build a semantic vector index
- Build a structural dependency graph
- Generate architecture diagrams
- Answer codebase questions using RAG and Graph RAG
- Show citations with file paths and line numbers
- Explain agent reasoning through trace logs
- Evaluate its own answers using retrieval, citation, and faithfulness metrics
- Help new developers onboard through guided learning paths

---

# 5. Target Users

## 5.1 Software Engineers

Need to quickly understand unfamiliar repositories.

## 5.2 AI Agent Engineers

Need a strong example of agent orchestration, tool use, RAG, Graph RAG, evaluation, and observability.

## 5.3 Open Source Contributors

Need to find important files, contribution areas, and module responsibilities.

## 5.4 Engineering Teams

Need faster onboarding for new developers.

## 5.5 Students and Interview Candidates

Need to understand repositories deeply for projects, internships, and interviews.

---

# 6. Core Features

## 6.1 Repository Analysis

User enters a GitHub repository URL.

System:

1. Validates the URL
2. Clones the repository safely
3. Scans files and folders
4. Ignores unwanted folders and secret files
5. Detects languages
6. Parses symbols
7. Extracts dependencies
8. Builds a dependency graph
9. Chunks code
10. Generates embeddings
11. Stores vectors and metadata
12. Generates summaries and architecture diagrams

---

## 6.2 Codebase Q&A

User asks:

- "How does authentication work?"
- "Where is the database configured?"
- "Which files should I read first?"
- "Explain the architecture."
- "Which modules depend on auth_service.py?"

System:

1. Classifies intent
2. Routes query to the correct agent
3. Retrieves context using vector search, keyword search, symbol search, and graph expansion
4. Builds grounded context
5. Generates answer
6. Adds citations
7. Logs trace
8. Evaluates response quality

---

## 6.3 Architecture Diagrams

System generates:

- Module diagram
- Dependency graph
- Request flow
- Data flow
- Mermaid diagram source

The architecture diagram should be generated from deterministic dependency data, not imagined by the LLM.

---

## 6.4 Developer Onboarding

System generates:

- Start-here files
- Learning path
- Important modules
- Key concepts
- Suggested first tasks
- Contribution guide

---

## 6.5 Agent Trace Viewer

Every agent run should show:

- User query
- Detected intent
- Selected agent
- Tools called
- Retrieved chunks
- Prompt used
- LLM response
- Latency
- Token usage
- Evaluation score

---

## 6.6 Evaluation Dashboard

System evaluates:

- Retrieval quality
- Citation accuracy
- Faithfulness
- Hallucination rate
- Agent routing accuracy
- Tool success rate
- Latency
- Cost estimate, if paid models are used in future

For full-free implementation, cost can be shown as local compute estimate instead of API cost.

---

# 7. Functional Requirements

## FR-1 Repository Input

The user must be able to submit:

- GitHub repository URL
- Branch name
- Optional access token for private repositories
- Analysis mode: Basic, Standard, Deep

---

## FR-2 Repository Validation

System must validate:

- URL format
- GitHub repository availability
- Branch existence
- Repository size limits
- Public/private accessibility

---

## FR-3 Safe Repository Cloning

System must clone the repository into an isolated temporary directory.

Rules:

- Do not execute repository code
- Do not install dependencies
- Do not run tests
- Do not run scripts
- Delete clone after analysis if configured

---

## FR-4 File Scanning

System must scan supported files:

- `.py`
- `.js`
- `.ts`
- `.tsx`
- `.jsx`
- `.md`
- `.json`
- `.yaml`
- `.yml`
- `.toml`

System must ignore:

- `.git`
- `node_modules`
- `venv`
- `.venv`
- `dist`
- `build`
- `coverage`
- `__pycache__`
- `.next`
- `.cache`

System must skip secret files:

- `.env`
- `.env.local`
- `.pem`
- `.key`
- `id_rsa`
- `credentials.json`
- `secrets.yaml`
- `secrets.yml`

---

## FR-5 Code Parsing

System must extract:

- Functions
- Classes
- Methods
- Imports
- Exports
- Routes
- Line numbers
- Docstrings
- Comments
- File summaries

MVP parsing:

- Python AST for Python
- Regex/basic parser for JS/TS imports and exports

Advanced parsing:

- Tree-sitter for multi-language parsing

---

## FR-6 Dependency Extraction

System must detect:

- File-to-file dependencies
- Module dependencies
- Import relationships
- Reverse dependencies
- Optional symbol-level relationships

Example:

```text
routes/auth.py → services/auth_service.py
services/auth_service.py → utils/jwt.py
services/auth_service.py → models/user.py
```

---

## FR-7 Vector Indexing

System must:

- Chunk code into meaningful blocks
- Generate embeddings using free local embedding models
- Store vectors in Qdrant
- Store metadata with each chunk
- Support metadata filtering by repo, file, language, symbol, and line range

---

## FR-8 Hybrid Retrieval

System must retrieve context using:

- Vector search
- Keyword search
- Symbol search
- Graph expansion
- Optional reranking

---

## FR-9 Agent Orchestration

System must use a graph-based agent workflow.

Agents:

- Supervisor Agent
- Intent Router Agent
- Repository Ingestion Agent
- Code Parser Agent
- Architecture Agent
- RAG Q&A Agent
- Graph RAG Agent
- Documentation Agent
- Onboarding Agent
- Evaluation Agent

---

## FR-10 Answer Citations

Every answer must cite:

- File path
- Line range
- Symbol name if available
- Why the source was used

Example:

```text
Sources:
1. backend/routes/auth.py lines 12-45
2. backend/services/auth_service.py lines 30-88
3. backend/utils/jwt.py lines 8-28
```

---

## FR-11 Documentation Generation

System must generate:

- README
- Architecture documentation
- API documentation
- Module documentation
- Contribution guide

---

## FR-12 Evaluation

System must support an evaluation dataset with:

- Question
- Expected files
- Expected answer points
- Expected agent
- Difficulty
- Category

System must calculate:

- Retrieval Recall@K
- Citation accuracy
- Agent routing accuracy
- Tool success rate
- Faithfulness score
- Hallucination flag

---

# 8. Non-Functional Requirements

## 8.1 Security

- Never execute cloned code
- Never install repository dependencies
- Never embed secrets
- Mask sensitive values in traces
- Limit file size
- Limit repository size
- Validate all inputs
- Use rate limiting
- Store tokens securely if private repo support exists

---

## 8.2 Reliability

- Jobs should not get stuck forever
- Worker failures should update job status
- Retry temporary failures
- Store error messages
- Support retry from failed step where possible

---

## 8.3 Scalability

Initial architecture should be a modular monolith.

Scale first by:

1. Adding more workers
2. Optimizing vector indexing
3. Caching repository analysis by commit hash
4. Splitting analysis and agent runtime services later

---

## 8.4 Observability

System must log:

- API requests
- Analysis jobs
- Agent runs
- Tool calls
- Retrieval results
- LLM calls
- Errors
- Latency
- Evaluation scores

---

# 9. System Design Principles

## 9.1 Deterministic System First, LLM Second

The LLM should not be the source of truth.

Correct design:

```text
Parser extracts facts
Database stores facts
Graph stores relationships
Retriever finds relevant context
LLM explains grounded context
```

Incorrect design:

```text
Send repo to LLM and ask it to guess architecture
```

---

## 9.2 Clean Architecture

Recommended backend structure:

```text
backend/
  app/
    api/
    core/
    domain/
    services/
    agents/
    tools/
    infrastructure/
```

Layer responsibilities:

- API layer handles HTTP
- Service layer handles business rules
- Agent layer handles orchestration and reasoning
- Tool layer performs concrete actions
- Infrastructure layer handles databases, queues, vector stores, LLMs
- Domain layer defines entities and interfaces

---

## 9.3 SOLID Principles

### Single Responsibility Principle

Each module should do one job.

Examples:

- `GitCloner` only clones repositories
- `FileScanner` only scans files
- `CodeParser` only parses code
- `EmbeddingService` only generates embeddings
- `RetrievalService` only retrieves context
- `QAAgent` only answers questions

### Open/Closed Principle

System should be open for extension but closed for modification.

Example:

Add a new parser by implementing a `CodeParser` interface instead of modifying a giant if-else block.

### Liskov Substitution Principle

A `QdrantVectorStore` and `ChromaVectorStore` should both be usable through a common `VectorStore` interface.

### Interface Segregation Principle

Do not create large interfaces with unrelated methods. Agents should only receive the tools they need.

### Dependency Inversion Principle

Agents should depend on abstractions:

- `LLMClient`
- `VectorStore`
- `CodeParser`
- `Retriever`

They should not directly depend on vendor-specific SDKs.

---

## 9.4 CAP Theorem Applied

CAP applies mainly to distributed data systems.

For this project:

- Repository job status should prefer consistency.
- Existing chat over already-indexed repos can prefer availability.
- Evaluation and analytics can be eventually consistent.

Examples:

- Do not mark repo as READY unless indexing is actually complete.
- If evaluation fails, still return the answer.
- If trace logging fails, return answer and retry logging later.

---

## 9.5 Idempotency

Running the same analysis twice should not corrupt data.

Use unique key:

```text
github_url + branch + commit_hash
```

If repository at same commit is already analyzed, reuse existing analysis or ask user whether to re-analyze.

---

## 9.6 Fault Tolerance

Possible failures:

- Invalid GitHub URL
- Clone failed
- Repo too large
- Unsupported language
- Secret detected
- Worker crash
- Embedding model unavailable
- Vector DB unavailable
- LLM timeout

System must:

- Store error state
- Show failed step
- Support retry
- Avoid partial READY state

---

## 9.7 Async Processing

Repository analysis must run as a background job.

Correct flow:

```text
POST /api/repositories/analyze
    ↓
Create job row
    ↓
Push job to Redis queue
    ↓
Worker processes repo
    ↓
Frontend polls job status
```

---

# 10. Technical Architecture

```text
Frontend: Next.js
    ↓
FastAPI Backend
    ↓
PostgreSQL + Redis + Qdrant
    ↓
RQ Worker
    ↓
Repository Analysis Pipeline
    ↓
LangGraph Agent Runtime
    ↓
Ollama Local LLM + Local Embeddings
```

---

# 11. Free Tech Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Mermaid.js
- React Flow
- Monaco Editor

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis
- RQ

## AI and Agents

- LangGraph
- LangChain Core
- Ollama
- Qwen2.5-Coder or DeepSeek-Coder
- sentence-transformers
- BAAI/bge-small-en-v1.5
- nomic-embed-text optional

## Vector Database

- Qdrant local

## Code Parsing

- Python AST
- Tree-sitter
- Regex fallback

## Graph

- PostgreSQL dependency tables
- NetworkX
- Mermaid
- React Flow

## Observability

- Custom agent trace tables
- OpenTelemetry optional
- Structured logs

## Evaluation

- Custom evaluation dataset
- RAGAS optional
- pytest

## Deployment

- Docker Compose local
- Optional Vercel free frontend
- Optional Hugging Face Spaces simplified demo

---

# 12. RAG Architecture

```text
User Question
    ↓
Intent Classifier
    ↓
Query Rewriter
    ↓
Hybrid Retrieval
    ├── Vector Search
    ├── Keyword Search
    ├── Symbol Search
    └── Graph Expansion
    ↓
Context Ranking
    ↓
Context Compression
    ↓
Answer Generation
    ↓
Citation Verification
    ↓
Evaluation
    ↓
Final Answer
```

---

# 13. Embedding Strategy

Use multiple indexing levels.

## Level 1: File-Level Summaries

Used for:

- Project overview
- Important files
- Onboarding

## Level 2: Symbol-Level Embeddings

Used for:

- Function explanation
- Class explanation
- Symbol lookup

## Level 3: Chunk-Level Embeddings

Used for:

- Detailed Q&A
- Code references
- Implementation details

## Level 4: Documentation Embeddings

Used for:

- README
- Docs
- Comments
- Config files

---

# 14. Vector DB Design

Qdrant collections:

```text
code_chunks
file_summaries
symbol_summaries
documentation_chunks
```

Payload metadata:

```json
{
  "repo_id": "repo_123",
  "file_path": "backend/auth.py",
  "language": "python",
  "chunk_type": "function",
  "symbol_name": "login_user",
  "start_line": 20,
  "end_line": 85,
  "commit_hash": "abc123"
}
```

---

# 15. Agent Workflow

```text
User Query
    ↓
Supervisor Agent
    ↓
Intent Router
    ↓
Selected Agent
    ↓
Tool Calls
    ↓
Retrieved Context
    ↓
Answer Generator
    ↓
Citation Verifier
    ↓
Evaluation Agent
    ↓
Final Response
```

---

# 16. Tool Registry

Tools:

- `validate_repo_url_tool`
- `clone_repo_tool`
- `scan_files_tool`
- `secret_filter_tool`
- `parse_symbols_tool`
- `extract_dependencies_tool`
- `semantic_search_tool`
- `keyword_search_tool`
- `symbol_search_tool`
- `graph_expansion_tool`
- `read_file_tool`
- `generate_mermaid_tool`
- `citation_builder_tool`
- `evaluate_answer_tool`

---

# 17. Database Schema

## users

```sql
id
name
email
password_hash
created_at
updated_at
```

## repositories

```sql
id
user_id
name
github_url
branch
commit_hash
status
total_files
total_chunks
created_at
updated_at
```

## analysis_jobs

```sql
id
repo_id
status
current_step
progress_percentage
error_message
started_at
completed_at
```

## files

```sql
id
repo_id
path
language
size_bytes
line_count
summary
is_indexed
created_at
```

## symbols

```sql
id
repo_id
file_id
name
symbol_type
signature
start_line
end_line
docstring
```

## dependencies

```sql
id
repo_id
source_file_id
target_file_id
source_symbol_id
target_symbol_id
dependency_type
confidence
```

## chat_sessions

```sql
id
repo_id
user_id
title
created_at
updated_at
```

## messages

```sql
id
session_id
role
content
citations_json
created_at
```

## agent_runs

```sql
id
repo_id
user_id
query
intent
selected_agent
status
latency_ms
token_count
estimated_cost
created_at
```

## tool_calls

```sql
id
agent_run_id
tool_name
input_json
output_json
status
latency_ms
created_at
```

## retrieved_contexts

```sql
id
agent_run_id
chunk_id
file_path
line_start
line_end
score
rank
used_in_answer
```

## evaluations

```sql
id
agent_run_id
faithfulness_score
retrieval_score
citation_score
routing_score
hallucination_flag
evaluator_notes
created_at
```

---

# 18. API Design

## Repository APIs

```text
POST /api/repositories/analyze
GET  /api/jobs/{job_id}
GET  /api/repositories
GET  /api/repositories/{repo_id}
GET  /api/repositories/{repo_id}/files
GET  /api/repositories/{repo_id}/files/{file_id}
GET  /api/repositories/{repo_id}/symbols
GET  /api/repositories/{repo_id}/dependencies
GET  /api/repositories/{repo_id}/architecture
POST /api/repositories/{repo_id}/reanalyze
DELETE /api/repositories/{repo_id}
```

## Chat APIs

```text
POST /api/repositories/{repo_id}/chat
GET  /api/repositories/{repo_id}/chat/sessions
GET  /api/chat/sessions/{session_id}
DELETE /api/chat/sessions/{session_id}
```

## Agent APIs

```text
GET /api/agent-runs
GET /api/agent-runs/{run_id}
GET /api/agent-runs/{run_id}/trace
POST /api/agent-runs/{run_id}/replay
```

## Evaluation APIs

```text
POST /api/repositories/{repo_id}/evaluations/run
GET  /api/repositories/{repo_id}/evaluations
GET  /api/evaluations
POST /api/evaluations/dataset/import
GET  /api/evaluations/dataset/export
```

---

# 19. Deployment Architecture

## Local Full-Free Deployment

```text
Docker Compose
  ├── frontend
  ├── backend
  ├── worker
  ├── postgres
  ├── redis
  ├── qdrant
  └── ollama
```

## Optional Demo Deployment

- Frontend: Vercel free
- Backend: local during demo or limited free service
- Full system: recorded local demo video
- README: architecture, screenshots, demo video

---

# 20. MVP Features

MVP must include:

- Repository analysis
- File scanning
- Secret filtering
- Python parsing
- Basic JS/TS import parsing
- Dependency graph
- Code chunking
- Local embeddings
- Qdrant vector search
- RAG Q&A with citations
- Architecture Mermaid diagram
- Agent trace logging
- Basic evaluation dataset
- Frontend dashboard

---

# 21. V2 Features

- LangGraph multi-agent workflow
- Full Graph RAG
- React Flow graph visualization
- Documentation generator
- Onboarding guide
- Evaluation dashboard
- Reranking
- Private repo support
- Streaming responses
- Tree-sitter multi-language parser

---

# 22. V3 Features

- Pull request review agent
- Test generation agent
- Refactoring agent
- Bug detection agent
- Team workspaces
- RBAC
- Kubernetes deployment
- Temporal workflow engine
- Neo4j graph database
- Self-hosted larger LLMs

---

# 23. Success Metrics

## Product Metrics

- Repository analysis success rate
- Average analysis time
- Number of repositories analyzed
- Number of questions asked
- User satisfaction

## AI Metrics

- Retrieval Recall@5
- Citation accuracy
- Faithfulness score
- Hallucination rate
- Agent routing accuracy
- Tool success rate

## System Metrics

- API latency
- Worker job duration
- Vector search latency
- LLM latency
- Error rate
- Queue depth

---

# 24. Final Positioning

Do not describe this project as:

> A chatbot for GitHub repositories.

Describe it as:

> A multi-agent codebase intelligence platform that combines static analysis, vector search, Graph RAG, LangGraph orchestration, local LLMs, tool calling, observability, and automated evaluation to help developers understand large repositories faster.
