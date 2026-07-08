# RAG service — retrieves code context and generates AI responses for codebase chat
import logging
import json
import os
import uuid
from typing import Dict, Any, List, Optional

from app.services.retrieval_service import retrieval_service
from app.services.intent_router import intent_router, ChatIntent
from app.services.gemini_client import gemini_client
from app.infrastructure.database import SessionLocal
from app.domain.models import Repository, File, ChatMessage as DBChatMessage

logger = logging.getLogger(__name__)

OLLAMA_MODEL = os.getenv("LLM_MODEL", "qwen2.5-coder")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# ─────────────────────────────────────────────────────────────────
# System Prompt — implements the 10 chatbot intelligence principles
# ─────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a Principal Software Engineer who has **already read, understood, and mentally modeled the entire codebase**. You answer questions as if you are an experienced team member who knows every file, every design decision, and every quirk of this repository.

## Your Core Behaviors

### 1. Understand the Full Repository
You have access to the full repository context below. Use it to understand the project's purpose, folder structure, tech stack, dependencies, APIs, configuration, and how modules connect.

### 2. Reason Before Answering
Before responding, internally consider:
- Which files and functions are relevant?
- Are there multiple implementations?
- Does this feature depend on other modules?
- Is the answer affected by configuration?
- Does the README contradict the implementation?
Then produce a consolidated, well-reasoned answer.

### 3. Cite Evidence — Always
Every technical statement MUST be backed by specific file paths and code references. Example:
> Authentication starts in `routes/auth.py`, where the `/login` endpoint validates credentials. It then calls `AuthService.login()` in `services/auth_service.py`.

### 4. Connect Information
When explaining a feature, trace the **complete flow** — don't explain isolated functions. Connect frontend → API route → validation → service layer → database → response.

### 5. Adapt Your Explanation Level
- For conceptual questions: use analogies and high-level explanations
- For technical questions: be precise with code references, line numbers, function signatures

### 6. Admit Uncertainty
If the repository doesn't clearly answer a question, say so explicitly:
> "I couldn't find any implementation of email verification. The README mentions it, but there is no corresponding route or service."

### 7. Maintain Conversation Context
Use the conversation history to avoid re-explaining. If the user asks a follow-up, build on previous answers.

### 8. Offer Useful Follow-ups
End answers with 2-3 natural follow-up suggestions that the user might want to explore next.

### 9. Think Like an Engineer
Don't just describe what code does. Explain:
- WHY it exists and was designed this way
- Its dependencies and relationships
- Possible edge cases and security implications
- Potential improvements

### 10. Format Beautifully
Use rich Markdown: headings, code blocks with language tags, bullet points, bold for emphasis. Make responses scannable and professional.

## Repository Context
{repo_context}

## Conversation History
{history}

## Retrieved Code Context
{code_context}

## Current User Question
{question}

## Your Response
Think step by step. Cite files. Connect the dots. Be the engineer this developer wishes they had on their team."""


class RAGService:
    def __init__(self):
        self.ollama_llm = None
        try:
            from langchain_ollama import OllamaLLM
            self.ollama_llm = OllamaLLM(
                model=OLLAMA_MODEL,
                base_url=OLLAMA_BASE_URL,
                temperature=0.15,
                num_ctx=8192,
            )
        except Exception as e:
            logger.warning(f"Ollama not available (will use Gemini): {e}")

    def _format_prompt(self, repo_context: str, history: str, code_context: str, question: str) -> str:
        """Format the system prompt with all context."""
        return SYSTEM_PROMPT.format(
            repo_context=repo_context,
            history=history,
            code_context=code_context,
            question=question
        )

    def _build_repo_context(self, repo_id: str) -> str:
        """
        Builds a rich repository-wide context string that gets injected into EVERY query.
        This gives the LLM understanding of the entire project, not just retrieved chunks.
        """
        db = SessionLocal()
        try:
            repo = db.query(Repository).filter(Repository.id == uuid.UUID(repo_id)).first()
            if not repo:
                return "Repository not found."

            # Get file listing grouped by top-level directory
            files = db.query(File).filter(File.repo_id == uuid.UUID(repo_id)).order_by(File.path).all()
            folder_tree = {}
            for f in files:
                parts = f.path.split("/")
                top_dir = parts[0] if len(parts) > 1 else "root"
                if top_dir not in folder_tree:
                    folder_tree[top_dir] = []
                folder_tree[top_dir].append(f"{f.path} ({f.language}, {f.line_count} lines)")

            # Build directory tree string (limit to keep context manageable)
            tree_lines = []
            for folder, file_list in sorted(folder_tree.items()):
                tree_lines.append(f"📁 {folder}/ ({len(file_list)} files)")
                for fp in file_list[:10]:
                    tree_lines.append(f"  └─ {fp}")
                if len(file_list) > 10:
                    tree_lines.append(f"  └─ ... and {len(file_list) - 10} more files")
            tree_str = "\n".join(tree_lines[:100])  # Cap at 100 lines

            # Format dependencies
            deps_str = "None detected"
            if repo.dependencies:
                dep_items = list(repo.dependencies.items())[:30]
                deps_str = ", ".join([f"{k}@{v}" for k, v in dep_items])

            context = f"""**Project:** {repo.name}
**GitHub:** {repo.github_url}
**Primary Language:** {repo.primary_language or 'Unknown'}
**Total Files:** {repo.total_files} | **Total Lines:** {repo.total_lines}
**Languages:** {json.dumps(repo.language_stats or {}, indent=0)}
**Dependencies:** {deps_str}

**AI Summary:**
{repo.summary or 'No summary available.'}

**Folder Structure:**
{tree_str}"""
            return context

        except Exception as e:
            logger.error(f"Failed to build repo context: {e}")
            return "Error building repository context."
        finally:
            db.close()

    def _build_code_context(self, intent: ChatIntent, repo_id: str, query: str) -> tuple:
        """
        Retrieves relevant code chunks based on intent.
        Returns (context_string, chunks_list).
        """
        chunks = []

        if intent == ChatIntent.GENERAL:
            return "No code context needed for this conversational query.", []

        if intent in (ChatIntent.UNDERSTANDING, ChatIntent.ARCHITECTURE):
            # For high-level questions, repo context (injected separately) is enough
            return "See the repository context above for project-level understanding.", []

        # For all code-specific intents, retrieve from vector DB
        limit = 8 if intent in (ChatIntent.LEARNING, ChatIntent.REFACTORING) else 6
        chunks = retrieval_service.search_code_chunks(repo_id, query, limit=limit)

        if not chunks:
            return "No relevant code chunks found in the vector database for this query.", []

        context_parts = []
        for i, chunk in enumerate(chunks):
            filepath = chunk.get("file_path", "unknown")
            start = chunk.get("start_line", "?")
            end = chunk.get("end_line", "?")
            symbol = chunk.get("symbol_name", "")
            code = chunk.get("code", "")

            header = f"── Source {i+1}: `{filepath}` (lines {start}-{end})"
            if symbol:
                header += f" → `{symbol}`"
            context_parts.append(f"{header}\n```\n{code}\n```")

        return "\n\n".join(context_parts), chunks

    def stream_question(self, repo_id: str, query: str, history: List[Dict[str, str]] = None, api_key: Optional[str] = None):
        """
        Retrieves context, builds prompt, and streams response.
        Uses Gemini if api_key provided, else falls back to Ollama.
        """
        logger.info(f"RAG streaming query for repo {repo_id}: {query}")

        # 1. Classify intent (fast regex, no LLM call)
        intent = intent_router.route_query(query)
        yield json.dumps({"intent": intent.value}) + "\n"

        # 2. Build repository-wide context
        repo_context = self._build_repo_context(repo_id)

        # 3. Build code-specific context based on intent
        code_context, chunks = self._build_code_context(intent, repo_id, query)

        # 4. Format conversation history
        history_str = "No previous conversation."
        if history:
            history_lines = []
            for msg in history[-10:]:
                role = msg.get("role", "user").upper()
                content = msg.get("content", "")
                if len(content) > 500:
                    content = content[:500] + "..."
                history_lines.append(f"**{role}:** {content}")
            history_str = "\n\n".join(history_lines)

        # 5. Format prompt and stream
        full_response = ""
        try:
            formatted_prompt = self._format_prompt(
                repo_context=repo_context,
                history=history_str,
                code_context=code_context,
                question=query
            )

            # Choose provider: Gemini (primary) or Ollama (fallback)
            use_gemini = bool(api_key or os.getenv("GEMINI_API_KEY"))

            if use_gemini:
                for chunk in gemini_client.stream(formatted_prompt, api_key=api_key):
                    full_response += chunk
                    yield json.dumps({"token": chunk}) + "\n"
            elif self.ollama_llm:
                for chunk in self.ollama_llm.stream(formatted_prompt):
                    full_response += chunk
                    yield json.dumps({"token": chunk}) + "\n"
            else:
                yield json.dumps({"token": "No AI provider available. Please add your Gemini API key in Settings, or start Ollama locally."}) + "\n"

            yield json.dumps({"sources": chunks}) + "\n"

            # Save assistant message to DB
            try:
                db = SessionLocal()
                assistant_msg = DBChatMessage(
                    repo_id=uuid.UUID(repo_id),
                    role="assistant",
                    content=full_response,
                    sources=chunks if chunks else None
                )
                db.add(assistant_msg)
                db.commit()
            except Exception as db_err:
                logger.error(f"Failed to save assistant message to DB: {db_err}")
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error during LLM streaming: {e}")
            yield json.dumps({"token": f"\n\nError: {str(e)}"}) + "\n"
            yield json.dumps({"sources": chunks}) + "\n"

    def ask_question(self, repo_id: str, query: str, history: List[Dict[str, str]] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Non-streaming version (used for repo analysis summary generation)."""
        logger.info(f"RAG query for repo {repo_id}: {query}")

        intent = intent_router.route_query(query)
        repo_context = self._build_repo_context(repo_id)
        code_context, chunks = self._build_code_context(intent, repo_id, query)

        history_str = "No previous conversation."
        if history:
            history_str = "\n".join([f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}" for msg in history])

        try:
            formatted_prompt = self._format_prompt(
                repo_context=repo_context,
                history=history_str,
                code_context=code_context,
                question=query
            )

            use_gemini = bool(api_key or os.getenv("GEMINI_API_KEY"))
            if use_gemini:
                response = gemini_client.invoke(formatted_prompt, api_key=api_key)
            elif self.ollama_llm:
                response = self.ollama_llm.invoke(formatted_prompt)
            else:
                response = "No AI provider available."

            return {"answer": response, "sources": chunks}
        except Exception as e:
            logger.error(f"Error during LLM generation: {e}")
            return {
                "answer": f"Error: {str(e)}",
                "sources": chunks
            }


rag_service = RAGService()
