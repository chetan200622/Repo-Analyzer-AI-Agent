# RepoMind Agent Frontend UI Specification

## Document Purpose

This document defines every major frontend page, subpage, section, button, table, panel, and user action for the RepoMind Agent project.

The UI should look like an **AI Agent Operations Console for Codebase Intelligence**, not a basic chatbot.

---

# 1. Global UI Philosophy

The frontend has two goals:

1. Help users analyze and understand GitHub repositories.
2. Show how the AI agent works internally through traces, tools, retrieval, and evaluation.

The most important pages are:

- Repository Overview
- Repository Chat with Citations
- Architecture Graph
- Agent Trace Viewer
- Evaluation Dashboard

---

# 2. Global Layout

All authenticated pages should use:

```text
Top Navbar
Sidebar
Main Content Area
Optional Right Panel
```

---

## 2.1 Top Navbar

### Left

- Logo
- Product name: `RepoMind Agent`
- Current repository selector

### Center

- Global search bar

Placeholder:

```text
Search repositories, files, symbols, agent runs...
```

### Right

Buttons:

- `+ Analyze Repo`
- `Docs`
- Theme toggle
- Notifications icon
- User profile menu

### User Profile Menu

Items:

- Profile
- API Keys
- Settings
- Logout

---

## 2.2 Sidebar

### Global Sidebar

Items:

- Dashboard
- Repositories
- Agent Runs
- Evaluations
- System Health
- Settings
- Documentation

### Repository Sidebar

When inside a repository:

- Overview
- Files
- Chat
- Architecture
- Dependencies
- Onboarding
- Documentation
- Agent Traces
- Evaluations
- Settings

---

# 3. Landing Page

Route:

```text
/
```

## 3.1 Navbar

Left:

- Logo
- RepoMind Agent

Right buttons:

- Features
- Architecture
- Demo
- Login
- Get Started

---

## 3.2 Hero Section

Heading:

```text
Understand Any GitHub Repository with AI Agents
```

Subheading:

```text
Analyze large codebases, generate architecture diagrams, ask natural language questions, and onboard developers faster using Agentic RAG and code graph intelligence.
```

Primary button:

```text
Analyze Repository
```

Action:

```text
Redirect to /repos/new
```

Secondary button:

```text
View Demo
```

Action:

```text
Open demo repository or scroll to demo section
```

Hero visual should show:

```text
GitHub Repo → Parser → Vector DB + Code Graph → LangGraph Agents → Answers + Diagrams
```

---

## 3.3 Feature Cards

Cards:

- Repository Analysis
- Codebase Q&A
- Architecture Diagrams
- Graph RAG
- Agent Tracing
- Evaluation Dashboard
- Developer Onboarding
- Documentation Generation

Each card contains:

- Icon
- Title
- Short description

---

## 3.4 Workflow Section

Steps:

1. Connect GitHub Repository
2. Scan and Parse Code
3. Build Vector + Dependency Index
4. Ask Questions
5. View Citations, Diagrams, and Agent Traces

---

## 3.5 Architecture Preview

Show:

```text
Frontend → FastAPI → LangGraph → Tools → PostgreSQL / Qdrant / Redis / Ollama
```

Button:

```text
Explore Architecture
```

---

## 3.6 Final CTA

Text:

```text
Start analyzing your first repository.
```

Button:

```text
Analyze Repo
```

---

# 4. Login Page

Route:

```text
/login
```

## Main Card

Fields:

- Email
- Password

Buttons:

- Login
- Continue with GitHub
- Forgot Password?
- Create Account

Login action:

```text
POST /api/auth/login
```

Success:

```text
Redirect to /dashboard
```

Error:

```text
Show invalid email or password message
```

---

# 5. Signup Page

Route:

```text
/signup
```

## Main Card

Fields:

- Full Name
- Email
- Password
- Confirm Password

Buttons:

- Create Account
- Continue with GitHub
- Already have an account? Login

Action:

```text
POST /api/auth/signup
```

Success:

```text
Redirect to /dashboard
```

---

# 6. Main Dashboard

Route:

```text
/dashboard
```

## Header

Title:

```text
Dashboard
```

Subtitle:

```text
Monitor repositories, agent runs, evaluations, and system health.
```

Buttons:

- Analyze New Repository
- Refresh Dashboard

---

## Metric Cards

Cards:

- Repositories Analyzed
- Active Analysis Jobs
- Total Agent Runs
- Average Faithfulness Score
- Average Retrieval Score
- Average Latency
- Failed Jobs
- Total Tool Calls

Each card shows:

- Metric name
- Metric value
- Trend indicator

---

## Recent Repositories Table

Columns:

- Repository
- Primary Language
- Status
- Files
- Chunks
- Last Analyzed
- Actions

Actions:

- Open
- Chat
- Architecture
- Re-analyze

---

## Recent Agent Runs Table

Columns:

- Query
- Repository
- Intent
- Selected Agent
- Status
- Latency
- Score
- Created At
- Actions

Actions:

- View Trace
- Open Chat

---

## System Health Cards

Cards:

- API Server
- Worker
- PostgreSQL
- Redis
- Qdrant
- Ollama

Status badges:

- Healthy
- Warning
- Down

---

# 7. Repositories List

Route:

```text
/repos
```

## Header

Title:

```text
Repositories
```

Buttons:

- Analyze New Repository
- Import from GitHub
- Refresh

---

## Filters Row

Search input:

```text
Search by repository name or URL
```

Filters:

- Language
- Status
- Date
- Sort dropdown

Sort options:

- Recently analyzed
- Oldest first
- Most files
- Most agent runs
- Highest evaluation score

---

## Repository Cards / Table

Each card shows:

- Repository name
- GitHub URL
- Branch
- Commit hash
- Primary language
- Status
- Total files
- Total symbols
- Total chunks
- Last analyzed

Buttons:

- Open Overview
- Ask Question
- View Architecture
- Re-analyze
- Delete

Status badges:

- READY
- PROCESSING
- FAILED
- PARTIAL
- QUEUED

---

# 8. Analyze New Repository Page

Route:

```text
/repos/new
```

## Header

Title:

```text
Analyze New Repository
```

Subtitle:

```text
Connect a GitHub repository and build an AI-readable code intelligence index.
```

---

## Main Form

### GitHub Repository URL

Placeholder:

```text
https://github.com/user/repository
```

Validation:

- Must be a valid GitHub URL

### Branch

Default:

```text
main
```

Placeholder:

```text
main / master / dev
```

### GitHub Access Token

Optional.

Helper text:

```text
Required only for private repositories.
```

Button:

- Show / Hide Token

---

## Analysis Mode

Radio cards:

### Basic

Includes:

- File tree
- Language detection
- Basic file summaries

### Standard

Includes:

- Symbols
- Dependencies
- Embeddings
- RAG Q&A
- Architecture diagram

### Deep

Includes:

- Graph RAG
- Call-flow analysis
- Documentation
- Onboarding guide
- Evaluation dataset

Default:

```text
Standard
```

---

## Advanced Options Accordion

Fields/toggles:

- Max file size
- Max repository size
- Allowed file extensions
- Ignored folders
- Enable secret scanning
- Generate file summaries
- Generate architecture diagram
- Generate onboarding guide
- Run evaluation after analysis

---

## Security Notice Card

Text:

```text
This system only reads repository files.
It does not execute code.
It does not install dependencies.
Secret files are skipped automatically.
```

---

## Buttons

Primary:

```text
Start Analysis
```

Action:

```text
POST /api/repositories/analyze
```

Secondary:

```text
Validate Repository
```

Action:

```text
Check if URL exists and branch is valid
```

Tertiary:

```text
Cancel
```

Action:

```text
Go back to /repos
```

---

# 9. Analysis Progress Page

Route:

```text
/repos/:repoId/analysis
```

## Header

Title:

```text
Analyzing Repository
```

Subtitle:

```text
Building code intelligence index for repository.
```

Buttons:

- Cancel Job
- View Logs
- Refresh

---

## Progress Bar

Shows:

- Overall progress percentage
- Current step
- Estimated remaining time

Example:

```text
62% complete — Generating embeddings
```

---

## Timeline Steps

Statuses:

- Pending
- Running
- Completed
- Failed
- Skipped

Steps:

1. Validating repository
2. Cloning repository
3. Scanning files
4. Filtering secrets
5. Detecting languages
6. Parsing symbols
7. Extracting dependencies
8. Building dependency graph
9. Chunking code
10. Generating embeddings
11. Creating file summaries
12. Generating architecture
13. Creating onboarding guide
14. Finalizing analysis

---

## Live Metric Cards

- Files scanned
- Files ignored
- Secrets skipped
- Languages detected
- Symbols extracted
- Dependencies found
- Chunks created
- Embeddings stored

---

## Logs Panel

Columns:

- Timestamp
- Step
- Message
- Status

Buttons:

- Copy Logs
- Download Logs

---

## Failure State

Show:

- Analysis Failed
- Failed Step
- Error Message
- Suggested Fix

Buttons:

- Retry From Failed Step
- Restart Full Analysis
- Go Back
- View Logs

---

## Success State

Text:

```text
Repository analysis completed successfully.
```

Buttons:

- Open Repository Dashboard
- Start Chat
- View Architecture

---

# 10. Repository Overview Page

Route:

```text
/repos/:repoId
```

## Header

Left:

- Repository name
- GitHub URL
- Branch
- Commit hash
- Status badge

Right buttons:

- Ask Question
- View Architecture
- Generate Docs
- Re-analyze
- Open GitHub

---

## Metric Cards

- Total Files
- Total Lines
- Languages
- Functions
- Classes
- Dependencies
- Chunks Indexed
- Agent Runs
- Evaluation Score

---

## AI Repository Summary Card

Title:

```text
AI Repository Summary
```

Content:

- Generated explanation of what the project does
- Main technologies
- Main modules
- Core purpose

Buttons:

- Regenerate Summary
- Copy Summary

---

## Architecture Summary Card

Contains:

- Detected architecture style
- Main layers
- Entry points
- Core modules

Buttons:

- View Full Architecture
- Copy Architecture Summary

---

## Important Files Section

Table columns:

- File Path
- Role
- Language
- Importance Score
- Actions

Actions:

- Open File
- Ask About File
- View Dependencies

---

## Recommended Questions

Question chips:

- Explain the project architecture
- How does authentication work?
- Where is the database initialized?
- Which files should I read first?
- What are the main modules?
- Generate onboarding guide

Clicking a chip opens chat with that question prefilled.

---

## Recent Agent Runs

Columns:

- Query
- Selected Agent
- Status
- Latency
- Score
- Created At
- Actions

Action:

- View Trace

---

# 11. File Explorer Page

Route:

```text
/repos/:repoId/files
```

## Layout

```text
Left Panel: File Tree
Center Panel: File Details
Right Panel: Symbols / Dependencies
```

---

## Left Panel

Search:

```text
Search files...
```

Filters:

- Language
- Indexed / Not Indexed
- Important files only

File tree icons:

- Python
- JavaScript
- TypeScript
- Markdown
- JSON
- YAML

---

## Center Panel

Empty state:

```text
Select a file to view details.
```

Selected file shows:

- File path
- Language
- Line count
- Size
- Indexed status
- Summary

Buttons:

- Open Full File
- Ask About This File
- View File Dependencies
- Copy Path

---

## Right Panel

### Symbols Table

Columns:

- Name
- Type
- Line Range
- Signature

Types:

- Function
- Class
- Method
- Variable
- Route

### Dependencies

Sections:

- Imports
- Imported By
- Related Files

Buttons:

- Open Dependency Graph
- Highlight Path

---

# 12. File Detail Page

Route:

```text
/repos/:repoId/files/:fileId
```

## Header

Shows:

- File path
- Language badge
- Line count
- Indexed status

Buttons:

- Ask About File
- Copy Path
- Open in GitHub
- View Dependencies

---

## Tabs

- Overview
- Code
- Symbols
- Dependencies
- Chunks
- File Chat

---

## Overview Tab

Contains:

- AI-generated file summary
- Purpose of file
- Role in architecture
- Important functions/classes
- Potential risks

Buttons:

- Regenerate Summary
- Copy Summary

---

## Code Tab

Contains:

- Code viewer
- Line numbers
- Syntax highlighting
- Highlighted cited lines

Buttons:

- Copy Code
- Copy Selected Lines
- Ask About Selected Lines

---

## Symbols Tab

Table columns:

- Symbol Name
- Type
- Signature
- Start Line
- End Line
- Description
- Actions

Actions:

- Explain
- Find Usages
- Ask Question

---

## Dependencies Tab

Sections:

- This file imports
- This file is imported by
- Related files from graph
- External packages used

Buttons:

- View Graph
- Open Related File

---

## Chunks Tab

Shows indexed chunks:

- Chunk ID
- Line range
- Chunk preview
- Embedding status

Buttons:

- View Chunk
- Copy Chunk
- Ask About Chunk

---

## File Chat Tab

Input placeholder:

```text
Ask anything about this file...
```

Suggested prompts:

- Explain this file
- Explain each function
- What are possible bugs?
- How is this file connected to the project?

---

# 13. Repository Chat Page

Route:

```text
/repos/:repoId/chat
```

## Layout

```text
Left: Chat Sessions
Center: Chat Window
Right: Sources + Agent Trace Preview
```

---

## Left Panel

Contains:

- New Chat button
- Search chats
- Chat session list

Each chat item:

- Chat title
- Last message time
- Delete button

---

## Center Chat Window

Top bar:

- Repository name
- Current mode selector

Mode options:

- General Q&A
- Architecture
- Debug Flow
- Documentation
- Onboarding

---

## Empty Chat State

Suggested cards:

- Explain this repository
- How does authentication work?
- Which files are most important?
- Generate onboarding guide
- Show request flow for login
- Where is database configured?

---

## Message UI

User message:

- Question text
- Timestamp

Agent message:

- Answer
- Confidence score
- Selected agent
- Sources
- Tool calls summary
- Trace button
- Copy button
- Regenerate button

---

## Chat Input

Placeholder:

```text
Ask about this repository...
```

Buttons/toggles:

- Send
- Attach file context
- Clear
- Use Graph RAG
- Use citations

---

## Right Panel: Sources

Each source shows:

- File path
- Line numbers
- Retrieval score
- Why retrieved
- Used in answer: Yes/No

Buttons:

- Open File
- View Lines
- Copy Citation

---

## Right Panel: Agent Trace Preview

Shows:

- Intent detected
- Selected agent
- Tools called
- Latency
- Token usage
- Evaluation score

Button:

- Open Full Trace

---

# 14. Architecture Page

Route:

```text
/repos/:repoId/architecture
```

## Header

Title:

```text
Architecture
```

Buttons:

- Regenerate Architecture
- Export Diagram
- Copy Mermaid
- Open Fullscreen

---

## Tabs

- Overview
- Module Diagram
- Dependency Graph
- Request Flow
- Data Flow
- Mermaid Source

---

## Overview Tab

Contains:

- Architecture summary
- Detected layers
- Entry points
- Core modules
- Design patterns detected

Cards:

- Entry Points
- API Layer
- Service Layer
- Data Layer
- Utility Layer

---

## Module Diagram Tab

Shows Mermaid diagram.

Controls:

- Zoom In
- Zoom Out
- Reset View
- Download PNG
- Copy Mermaid

---

## Dependency Graph Tab

Interactive graph.

Controls:

- Search node
- Filter by folder
- Filter by language
- Highlight selected node
- Show only direct dependencies
- Show full graph

Node click opens drawer with:

- File name
- Summary
- Imports
- Imported by
- Open file button
- Ask about this file button

---

## Request Flow Tab

Dropdown:

```text
Select detected flow
```

Examples:

- Login flow
- Signup flow
- Create user flow
- Payment flow
- API request lifecycle

Shows:

- Step-by-step flow diagram
- Files involved
- Functions involved

Buttons:

- Explain Flow
- Ask About Flow
- Copy Flow

---

## Data Flow Tab

Shows:

```text
Request → Controller → Service → Database → Response
```

Sections:

- Input data
- Transformations
- Database operations
- Output response

---

## Mermaid Source Tab

Code editor with Mermaid code.

Buttons:

- Copy Mermaid
- Download `.mmd`
- Regenerate

---

# 15. Dependencies Page

Route:

```text
/repos/:repoId/dependencies
```

## Header Buttons

- Refresh Dependencies
- Export CSV
- Open Graph View
- Find Circular Dependencies

---

## Tabs

- File Dependencies
- Symbol Dependencies
- External Packages
- Circular Dependencies
- Dependency Search

---

## File Dependencies Tab

Table columns:

- Source File
- Target File
- Dependency Type
- Confidence
- Actions

Actions:

- Open Source
- Open Target
- View Path
- Ask About Dependency

---

## Symbol Dependencies Tab

Table columns:

- Source Symbol
- Target Symbol
- Relationship
- File
- Line
- Actions

Relationships:

- calls
- imports
- extends
- uses
- instantiates

---

## External Packages Tab

Table columns:

- Package
- Version
- Manifest File
- Used In Files
- Purpose
- Risk

Buttons:

- Find Usages
- Explain Package

---

## Circular Dependencies Tab

Each card shows:

- Cycle path
- Files involved
- Severity
- Suggested fix

Buttons:

- View Cycle Graph
- Ask Agent to Explain
- Copy Fix Suggestion

---

## Dependency Search Tab

Search placeholder:

```text
Find dependencies for file/function/package...
```

Results:

- Direct dependencies
- Reverse dependencies
- Related files

---

# 16. Onboarding Page

Route:

```text
/repos/:repoId/onboarding
```

## Header

Title:

```text
Developer Onboarding Guide
```

Buttons:

- Regenerate Guide
- Export as Markdown
- Copy Guide

---

## Project Summary

Contains:

- What the project does
- Main technologies
- Architecture style
- Important modules

---

## Start Here

Ordered list:

1. README.md
2. main.py / app.ts
3. routes folder
4. services folder
5. database/config files

Each item buttons:

- Open File
- Ask About This
- Mark as Read

---

## Learning Path

Timeline:

- Day 1: Understand project purpose and setup
- Day 2: Understand entry points
- Day 3: Understand routes/controllers
- Day 4: Understand services/business logic
- Day 5: Understand database/models
- Day 6: Understand tests/configuration
- Day 7: Pick first contribution

Buttons:

- Customize Plan
- Export Plan

---

## Key Concepts

Cards:

- Authentication
- Database
- Routing
- State Management
- API Layer
- Error Handling
- Configuration

Each card buttons:

- Explain
- Show Files
- Ask Question

---

## Suggested First Tasks

Cards:

- Improve README
- Add missing tests
- Add logging
- Fix duplicate code
- Document API route
- Refactor small utility

Each card shows:

- Difficulty
- Files involved
- Why this is good for beginners

Buttons:

- View Details
- Ask Agent

---

# 17. Documentation Page

Route:

```text
/repos/:repoId/docs
```

## Header Buttons

- Generate All Docs
- Export Markdown
- Copy Docs
- Download ZIP

---

## Tabs

- README
- Architecture Docs
- API Docs
- Module Docs
- Contribution Guide

---

## README Tab

Sections generated:

- Project Title
- Overview
- Features
- Tech Stack
- Installation
- Environment Variables
- Usage
- Architecture
- API Routes
- Contributing
- License

Buttons:

- Generate README
- Regenerate
- Copy Markdown
- Download README.md

---

## Architecture Docs Tab

Contains:

- System overview
- Layer explanation
- Module responsibilities
- Dependency diagram
- Request flow

Buttons:

- Regenerate
- Copy
- Download

---

## API Docs Tab

Table columns:

- Method
- Endpoint
- Handler File
- Function
- Description
- Auth Required

Buttons:

- Generate API Docs
- Copy Table
- Export Markdown

---

## Module Docs Tab

Module cards:

- Purpose
- Files
- Functions
- Dependencies

Buttons:

- Generate Module Doc
- Open Files
- Ask About Module

---

## Contribution Guide Tab

Generated sections:

- How to set up locally
- Folder structure
- Coding conventions
- Testing instructions
- How to add a feature
- How to submit PR

Buttons:

- Generate Guide
- Copy
- Download

---

# 18. Agent Runs List Page

Route:

```text
/agent-runs
```

## Header

Title:

```text
Agent Runs
```

Buttons:

- Refresh
- Export Runs
- Filter Failed Runs

---

## Filters

- Repository
- Agent Type
- Intent
- Status
- Date Range
- Evaluation Score

---

## Table Columns

- Run ID
- Repository
- User Query
- Intent
- Selected Agent
- Status
- Latency
- Tokens
- Cost
- Evaluation Score
- Created At
- Actions

Actions:

- View Trace
- Open Repository
- Replay Query

Statuses:

- SUCCESS
- FAILED
- PARTIAL
- TIMEOUT

---

# 19. Agent Run Trace Detail Page

Route:

```text
/agent-runs/:runId
```

## Header

Title:

```text
Agent Run Trace
```

Buttons:

- Replay Run
- Export Trace
- Copy Run ID
- Open Repository

---

## Query Summary

Shows:

- User question
- Repository
- Detected intent
- Selected agent
- Final answer
- Status
- Timestamp

---

## LangGraph Flow

Visual flow:

```text
Supervisor → Intent Router → Selected Agent → Tools → Answer Generator → Evaluator
```

Each node shows:

- Node name
- Status
- Latency

Click node opens details drawer.

---

## Tool Calls Table

Columns:

- Tool Name
- Input Preview
- Output Preview
- Status
- Latency
- Error

Buttons per row:

- View Input
- View Output
- Copy JSON

Example tools:

- semantic_search_tool
- symbol_lookup_tool
- dependency_graph_tool
- read_file_tool
- citation_builder_tool
- evaluation_tool

---

## Retrieved Context Table

Columns:

- Rank
- File Path
- Line Range
- Retrieval Score
- Used in Answer
- Actions

Actions:

- Open File
- View Chunk
- Copy Citation

---

## Prompt Viewer

Tabs:

- System Prompt
- User Prompt
- Retrieved Context
- Final LLM Response

Buttons:

- Copy Prompt
- Copy Response

Important:

- Mask secrets

---

## Metrics Cards

- Total Latency
- Prompt Tokens
- Completion Tokens
- Estimated Cost
- Retrieval Recall
- Faithfulness Score
- Citation Score

---

## Evaluation Result

Shows:

- Groundedness
- Citation correctness
- Hallucination flag
- Evaluator notes
- Suggested improvement

---

# 20. Global Evaluations Page

Route:

```text
/evaluations
```

## Header

Title:

```text
Evaluations
```

Buttons:

- Run Global Evaluation
- Export Report
- Refresh

---

## Metric Cards

- Total Eval Runs
- Average Faithfulness
- Retrieval Recall@5
- Citation Accuracy
- Hallucination Rate
- Agent Routing Accuracy
- Average Latency
- Average Cost

---

## Evaluation Runs Table

Columns:

- Eval Run ID
- Repository
- Questions
- Passed
- Failed
- Average Score
- Created At
- Actions

Actions:

- View Results
- Export
- Delete

---

# 21. Repository Evaluation Page

Route:

```text
/repos/:repoId/evaluations
```

## Header Buttons

- Run Evaluation
- Create Test Question
- Import Dataset
- Export Results

---

## Tabs

- Run Evaluation
- Results
- Failed Cases
- Dataset
- Metrics

---

## Run Evaluation Tab

Options:

- Quick Evaluation - 10 questions
- Standard Evaluation - 30 questions
- Deep Evaluation - 50+ questions
- Custom Evaluation

Checkboxes:

- Evaluate retrieval
- Evaluate citations
- Evaluate answer faithfulness
- Evaluate routing
- Evaluate latency

Button:

- Start Evaluation

---

## Results Tab

Table columns:

- Question
- Expected Files
- Retrieved Files
- Answer Score
- Citation Score
- Routing Correct
- Passed/Failed
- Actions

Actions:

- View Details
- Open Trace
- Re-run Question

---

## Failed Cases Tab

Each card shows:

- Question
- Failure Type
- Expected Behavior
- Actual Behavior
- Root Cause
- Suggested Fix

Failure types:

- Wrong retrieval
- Missing citation
- Hallucination
- Wrong agent selected
- Timeout
- Poor answer

Buttons:

- Open Trace
- Re-run
- Mark Fixed

---

## Dataset Tab

Table columns:

- Question
- Expected Files
- Expected Answer Points
- Difficulty
- Category
- Actions

Buttons:

- Add Question
- Edit
- Delete
- Import JSON
- Export JSON

---

## Metrics Tab

Charts/cards:

- Retrieval Recall@K
- Citation Accuracy
- Faithfulness Trend
- Latency Trend
- Cost Trend
- Agent Routing Accuracy

---

# 22. Repository Settings Page

Route:

```text
/repos/:repoId/settings
```

## Tabs

- General
- Analysis
- Security
- Indexing
- Danger Zone

---

## General Tab

Fields:

- Repository name
- GitHub URL
- Branch
- Commit hash
- Description

Buttons:

- Save Changes
- Open GitHub

---

## Analysis Tab

Settings:

- Analysis mode
- Max file size
- Max repo size
- Allowed extensions
- Ignored folders
- Enable deep parsing
- Enable graph analysis
- Enable documentation generation
- Enable onboarding generation

Buttons:

- Save Settings
- Re-analyze Repository

---

## Security Tab

Settings:

- Secret scanning enabled
- Ignored secret files
- Delete local clone after analysis
- Mask secrets in traces
- Private repo token status

Buttons:

- Rotate Token
- Remove Token
- Save Security Settings

---

## Indexing Tab

Settings:

- Embedding model
- Chunk size
- Chunk overlap
- Top-K retrieval
- Enable reranking
- Enable keyword search
- Enable graph expansion

Buttons:

- Save Indexing Settings
- Rebuild Vector Index
- Rebuild Graph Index

---

## Danger Zone Tab

Danger actions:

- Delete repository analysis
- Delete vector index
- Delete graph index
- Delete all chat history

Each button opens confirmation modal.

Confirmation:

```text
Type repository name to confirm.
```

---

# 23. Global Settings Page

Route:

```text
/settings
```

## Tabs

- Profile
- LLM Provider
- Embeddings
- Agents
- API Keys
- Appearance

---

## Profile Tab

Fields:

- Name
- Email
- Password

Buttons:

- Save Profile
- Change Password
- Logout

---

## LLM Provider Tab

Fields:

- Provider
- Model
- Temperature
- Max tokens
- Timeout
- Retry count

Provider options for free stack:

- Ollama
- Local LLM

Buttons:

- Save Provider
- Test Connection

---

## Embeddings Tab

Fields:

- Embedding provider
- Embedding model
- Chunk size
- Chunk overlap
- Batch size

Buttons:

- Save Embedding Settings
- Test Embeddings

---

## Agents Tab

Toggles:

- Enable LangGraph tracing
- Enable tool-call logging
- Enable evaluation after every answer
- Enable Graph RAG
- Enable citation verification
- Enable fallback agent

Buttons:

- Save Agent Settings
- Reset Defaults

---

## API Keys Tab

For full-free local stack, API keys are optional.

Fields:

- GitHub Token
- Optional external LLM key for future

Buttons:

- Save Keys
- Test Keys
- Delete Keys

Important:

- Always mask keys
- Never show raw keys in traces

---

## Appearance Tab

Settings:

- Theme: Light / Dark / System
- Accent color
- Compact mode
- Code font size

Buttons:

- Save Appearance
- Reset Theme

---

# 24. System Health Page

Route:

```text
/system-health
```

## Cards

- API Server
- Worker Service
- Queue
- PostgreSQL
- Qdrant
- Ollama
- Embedding Provider

Each card shows:

- Status
- Latency
- Last checked
- Error if any

Buttons:

- Refresh Health
- Run Diagnostics

---

## Recent Errors Table

Columns:

- Timestamp
- Service
- Error
- Severity
- Status
- Actions

Actions:

- View Details
- Copy Error
- Mark Resolved

---

# 25. MVP UI Build Order

Build these first:

1. Analyze New Repository
2. Analysis Progress
3. Repository Overview
4. File Explorer
5. File Detail
6. Repository Chat
7. Architecture Page
8. Agent Run Trace Page
9. Repository Evaluation Page
10. Repository Settings

Landing page can come after the product UI works.

---

# 26. Best Demo Flow

Demo sequence:

1. Open `/repos/new`
2. Enter GitHub URL
3. Click Start Analysis
4. Show Analysis Progress page
5. Open Repository Overview
6. Open File Explorer
7. Open Architecture page
8. Ask: "How does authentication work?"
9. Show answer with citations
10. Open Agent Trace
11. Show tools, retrieved chunks, prompt, and metrics
12. Open Evaluation page
13. Show failed cases and improvement suggestions

This demo proves:

- System design
- RAG
- Graph RAG
- Agent orchestration
- Tool calling
- Observability
- Evaluation
- Security awareness
- Frontend product thinking
